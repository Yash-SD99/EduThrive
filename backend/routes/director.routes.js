import express from "express"
import { protect } from "../middleware/auth.middleware.js"
import { allowRoles } from "../middleware/role.middleware.js"

const router = express.Router()

//applicable to all director routes
router.use(protect)
router.use(allowRoles("director"))

router.get("/dashboard", (req, res) => {
    res.json({ message: "Director dashboard OK" })
})

export default router