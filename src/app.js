import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))
app.use(express.static("public"))
app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}))



//routes
import userRouter from "./routes/user.routes.js"
import adminRouter from "./routes/admin.routes.js";
import categoryRouter from "./routes/category.routes.js"

//routes declaration
app.use("/user", userRouter)
app.use("/admin", adminRouter)
app.use("/category", categoryRouter)


export { app }