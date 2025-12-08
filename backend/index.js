import express from "express";
const app = express();
const PORT = 3000; 
import usersRoute from "./src/routes/admin/usersRoute.js";
import userAuthRoute from "./src/routes/userAuthenticationRoute.js";
import userProfile from "./src/routes/userProfileRoute.js"
import cookieParser from "cookie-parser";
app.use(express.json());
app.use(cookieParser());


app.use("/auth",userAuthRoute);
app.use("/admin", usersRoute);
app.use("/profile", userProfile);





app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
