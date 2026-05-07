import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import patientsRouter from "./patients";
import opdRouter from "./opd";
import consultationsRouter from "./consultations";
import ipdRouter from "./ipd";
import mediclaimRouter from "./mediclaim";
import billingRouter from "./billing";
import dischargeRouter from "./discharge";
import reportsRouter from "./reports";
import auditRouter from "./audit";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(patientsRouter);
router.use(opdRouter);
router.use(consultationsRouter);
router.use(ipdRouter);
router.use(mediclaimRouter);
router.use(billingRouter);
router.use(dischargeRouter);
router.use(reportsRouter);
router.use(auditRouter);

export default router;
