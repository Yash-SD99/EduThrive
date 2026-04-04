import Institute from "../models/Institute.js";
import Director from "../models/Director.js";

// ============================================================
// POST /api/institute/register
// Creates a new institute + director account.
// Does NOT log the director in — they must login manually.
// ============================================================
export const registerInstitute = async (req, res) => {
  try {
    const {
      // Institute fields
      instituteName,
      instituteCode,
      address,
      establishedYear,
      // Director fields
      firstName,
      lastName,
      phone,
    } = req.body;

    // ── 1. Validate all required fields ──
    if (
      !instituteName ||
      !instituteCode ||
      !address ||
      !establishedYear ||
      !firstName ||
      !lastName ||
      !phone
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ── 2. Normalise institute code → always uppercase ──
    const code = instituteCode.trim().toUpperCase();

    // ── 3. Check institute code uniqueness ──
    const existingInstitute = await Institute.findOne({ code });

    if (existingInstitute) {
      return res.status(400).json({
        success: false,
        message: `Institute code "${code}" is already taken. Please choose a different code.`,
      });
    }

    // ── 4. Create Institute document ──
    const institute = await Institute.create({
      name:            instituteName.trim(),
      code,
      address:         address.trim(),
      establishedYear: Number(establishedYear),
    });

    // ── 5. Auto-generate director credentials ──
    //    email:    firstName_lastName@code.edu  (lowercased)
    //    password: Pass@123
    const cleanFirst       = firstName.trim().toLowerCase().replace(/\s+/g, "");
    const cleanLast        = lastName.trim().toLowerCase().replace(/\s+/g, "");
    const directorEmail    = `${cleanFirst}_${cleanLast}@${code.toLowerCase()}.edu`;
    const directorPassword = "Pass@123";

    // ── 6. Guard against duplicate director email ──
    const existingDirector = await Director.findOne({ email: directorEmail });

    if (existingDirector) {
      // Roll back the created institute to keep DB clean
      await Institute.findByIdAndDelete(institute._id);

      return res.status(400).json({
        success: false,
        message:
          "A director with this email already exists. " +
          "Please use a different name or institute code.",
      });
    }

    // ── 7. Create Director document ──
    //    Password hashing is handled by the Director pre-save hook in the model.
    await Director.create({
      firstName:          firstName.trim(),
      lastName:           lastName.trim(),
      phone:              phone.trim(),
      email:              directorEmail,
      password:           directorPassword,
      role:               "director",
      institute:          institute._id,
      mustChangePassword: true,   // force password change on first login
    });

    // ── 8. Return success — do NOT issue JWT ──
    return res.status(201).json({
      success: true,
      message:
        "Institute registered successfully. Use the credentials below to log in.",
      data: {
        instituteName:   institute.name,
        instituteCode:   code,
        loginUrl:        `/${code}/login`,
        directorEmail,
        defaultPassword: directorPassword,
      },
    });

  } catch (error) {
    console.error("registerInstitute error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};