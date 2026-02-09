import express from "express"
import { protect } from "../middleware/auth.middleware.js"
import { allowRoles } from "../middleware/role.middleware.js"

const router = express.Router()

//applicable to all hod routes
router.use(protect)
router.use(allowRoles("hod"))

router.get("/dashboard", (req, res) => {
    res.json({message: "HOD dashboard OK"})
})

export default router