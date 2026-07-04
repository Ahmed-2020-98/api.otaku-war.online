//imports
require("./instrument");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./docs/swagger");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");
const { notFound } = require("./middleware/notFoundHandler");
const userRouter = require("./api/routes/User.routes");
const passport = require("passport");
const { localStrategy, jwtStrategy } = require("./middleware/passport");
const categoryRouter = require("./api/routes/Category.routes");
const questionRouter = require("./api/routes/Question.routes");
const gameRouter = require("./api/routes/Game.routes");
const helmet = require("helmet");
const path = require("path");
const config = require("./config/config");
const complaintRouter = require("./api/routes/Complaint.routes");
const creditPackageRouter = require("./api/routes/CreditPackage.routes");
const paymentRouter = require("./api/routes/Payment.routes");
const discountCodeRouter = require("./api/routes/DiscountCode.routes");
const cacheStatsRouter = require("./api/routes/CacheStats.routes");
const Sentry = require("@sentry/node");
const mongoose = require("mongoose");
// init
const PORT = config.port;
const app = express();

// middlewares
// app.use(helmet());
app.use(
  cors({
    origin:
      config.env === "development" || config.env === "test"
        ? "*"
        : [
            "https://admin.otaku-war.com",
            "https://www.otaku-war.com",
            "https://otaku-war-game.vercel.app",
            "https://otaku-war.com",
            "https://otaku-war-game-testing.vercel.app",
            "http://157.245.42.236",
            "https://otaku-war.online",
            "https://www.otaku-war.online",
            "https://admin.otaku-war.online",
          ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(morgan("dev"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(passport.initialize());
passport.use("local", localStrategy);
passport.use("jwt", jwtStrategy);
app.disable("x-powered-by");

app.get("/debug-sentry", function mainHandler(req, res) {
  // Send a log before throwing the error
  console.log("User triggered test error");
  Sentry.logger.info("User triggered test error", {
    action: "test_error_endpoint",
  });
  throw new Error("My first Sentry error!");
});

app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const payload = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
    db:
      dbState === 1
        ? "connected"
        : dbState === 2
        ? "connecting"
        : "disconnected",
    // Temporary diagnostics (safe: boolean + error message, no secrets)
    dbConfigured: connectDB.isConfigured(),
    dbError: connectDB.getLastError(),
    // Names only (no values) of env vars that look DB-related, + total count,
    // to see what was actually set in the app environment.
    dbEnvKeys: Object.keys(process.env).filter((k) =>
      /mongo|atlas|uri|url|_db|database/i.test(k)
    ),
    envCount: Object.keys(process.env).length,
  };
  res.status(dbState === 1 ? 200 : 503).json(payload);
});
// routes
app.use("/media", express.static(path.join(__dirname, "media")));
app.use("/api/users", userRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/questions", questionRouter);
app.use("/api/games", gameRouter);
app.use("/api/complaints", complaintRouter);
app.use("/api/credit-packages", creditPackageRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/discount-codes", discountCodeRouter);
app.use("/api/cache", cacheStatsRouter);

// connect to db
connectDB();

// setup sentry
Sentry.setupExpressErrorHandler(app);

// not found handler
app.use(notFound);

// error handler
app.use(errorHandler);
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

// server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// deploy trigger 2026-07-04T12:37:30Z
