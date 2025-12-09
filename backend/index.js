import express from "express";
const app = express();
import cors from "cors";
const PORT = 3000;
import usersRoute from "./src/routes/admin/usersRoute.js";
import userAuthRoute from "./src/routes/userAuthenticationRoute.js";
import userProfile from "./src/routes/userProfileRoute.js"
import projectRoute from "./src/routes/admin/projectsRoute.js";
import cookieParser from "cookie-parser";
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use("/auth",userAuthRoute);
app.use("/admin", usersRoute);
app.use("/admin/projects", projectRoute);
app.use("/profile", userProfile);




app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
