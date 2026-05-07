import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListUsers, useCreateUser, useUpdateUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Users, UserCheck, UserX } from "lucide-react";

export default function SettingsUsers() {
  const qc = useQueryClient();
  const { data: users, isLoading } = useListUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const [addOpen, setAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", name: "", role: "receptionist" as "admin" | "doctor" | "receptionist" });

  const handleCreate = () => {
    if (!newUser.username || !newUser.password || !newUser.name) {
      toast.error("All fields required");
      return;
    }
    createUser.mutate({ data: newUser }, {
      onSuccess: () => {
        toast.success("User created");
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setAddOpen(false);
        setNewUser({ username: "", password: "", name: "", role: "receptionist" });
      },
      onError: () => toast.error("Failed to create user"),
    });
  };

  const handleToggleActive = (id: number, active: boolean) => {
    updateUser.mutate({ id, data: { active: !active } }, {
      onSuccess: () => {
        toast.success(`User ${active ? "deactivated" : "activated"}`);
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
      onError: () => toast.error("Failed to update user"),
    });
  };

  const ROLE_COLORS: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700 border-purple-200",
    doctor: "bg-blue-100 text-blue-700 border-blue-200",
    receptionist: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">{(users ?? []).length} system users</p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-user"><Plus className="w-4 h-4 mr-2" />Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <Input placeholder="Full Name *" value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} />
                <Input placeholder="Username *" value={newUser.username} onChange={e => setNewUser(u => ({ ...u, username: e.target.value }))} />
                <Input type="password" placeholder="Password *" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} />
                <Select value={newUser.role} onValueChange={(v) => setNewUser(u => ({ ...u, role: v as typeof u.role }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreate} disabled={createUser.isPending} className="w-full">
                  {createUser.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="border-b pb-3"><CardTitle className="text-sm font-medium">System Users</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : (users ?? []).length === 0 ? (
              <div className="text-center py-10 text-muted-foreground"><Users className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No users found</p></div>
            ) : (
              <div className="divide-y">
                {(users ?? []).map(user => (
                  <div key={user.id} className="flex items-center justify-between px-6 py-4" data-testid={`row-user-${user.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${ROLE_COLORS[user.role] ?? ""}`}>{user.role}</span>
                      {user.active ? (
                        <Button size="sm" variant="ghost" className="text-muted-foreground h-8" onClick={() => handleToggleActive(user.id, user.active)}>
                          <UserX className="w-3.5 h-3.5 mr-1.5" />Deactivate
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-primary h-8" onClick={() => handleToggleActive(user.id, user.active)}>
                          <UserCheck className="w-3.5 h-3.5 mr-1.5" />Activate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
