import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import nocache from "nocache";
import flash from "express-flash";

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

app.use(nocache());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}))

app.use(flash())

// setting view engine
app.set("view engine", "ejs");
app.set("views", ["views/admin.views", "views/user.views"])

app.use(express.static("../public"))



//routes
import userRouter from "./routes/user.routes.js"
import adminRouter from "./routes/admin.routes.js";
import categoryRouter from "./routes/category.routes.js"
import productRouter from "./routes/product.routes.js"


//routes declaration
app.use("/user", userRouter)
app.use("/admin", adminRouter)
app.use("/category", categoryRouter)
app.use("/product", productRouter)


export { app }