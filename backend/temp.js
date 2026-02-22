import bcrypt from "bcryptjs";

let a = bcrypt.hashSync("Pass@123");

console.log(a);