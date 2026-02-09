import bcrypt from "bcryptjs";

let a = bcrypt.hashSync("password123");

console.log(a);