import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreatePatient, useListPatients } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Alert, AlertDescription } from "@/components/ui/alert";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["male", "female", "other"]),
  mobile: z.string().min(10, "Enter a valid mobile number").max(15),
  age: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  aadhaar: z.string().optional(),
  bloodGroup: z.string().optional(),
});

export default function PatientRegister() {
  const [_, setLocation] = useLocation();
  const createMutation = useCreatePatient();
  const [mobileQuery, setMobileQuery] = useState("");
  const debouncedMobile = useDebounce(mobileQuery, 400);
  const { data: existing } = useListPatients(debouncedMobile.length >= 10 ? { q: debouncedMobile } : {});
  const duplicateFound = (existing?.patients ?? []).length > 0 && debouncedMobile.length >= 10;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", gender: "male", mobile: "", age: "", address: "", emergencyContact: "", aadhaar: "", bloodGroup: "" },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    createMutation.mutate({
      data: {
        name: values.name,
        gender: values.gender as "male" | "female" | "other",
        mobile: values.mobile,
        age: values.age ? parseInt(values.age) : null,
        address: values.address || null,
        emergencyContact: values.emergencyContact || null,
        aadhaar: values.aadhaar || null,
        bloodGroup: values.bloodGroup || null,
      },
    }, {
      onSuccess: (patient) => {
        toast.success(`Patient registered: ${patient.patientId}`);
        setLocation(`/patients/${patient.id}`);
      },
      onError: () => toast.error("Failed to register patient"),
    });
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/patients"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold">Register Patient</h1>
            <p className="text-muted-foreground mt-1">Create a new patient record</p>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-medium">Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl><Input placeholder="Patient full name" {...field} data-testid="input-name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="mobile" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="10-digit mobile" {...field} data-testid="input-mobile"
                          onChange={(e) => { field.onChange(e); setMobileQuery(e.target.value); }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger data-testid="select-gender"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {duplicateFound && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      A patient with mobile {mobileQuery} already exists. Please search for them first.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl><Input type="number" placeholder="Years" {...field} data-testid="input-age" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bloodGroup" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Group</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                            <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl><Input placeholder="Residential address" {...field} data-testid="input-address" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="emergencyContact" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact</FormLabel>
                      <FormControl><Input placeholder="Name / Number" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="aadhaar" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar (Optional)</FormLabel>
                      <FormControl><Input placeholder="12-digit Aadhaar" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={createMutation.isPending || duplicateFound} className="flex-1" data-testid="button-save-patient">
                    {createMutation.isPending ? "Registering..." : "Register Patient"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/patients">Cancel</Link>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
