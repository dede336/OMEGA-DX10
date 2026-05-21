import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth.js";
import savesRouter from "./saves.js";
import leaderboardRouter from "./leaderboard.js";
import playersRouter from "./players.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/saves", savesRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/players", playersRouter);

export default router;
