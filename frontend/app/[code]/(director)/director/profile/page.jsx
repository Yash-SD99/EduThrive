"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

const Profile = () => {
  const [director, setDirector] = useState(null);

  // =============================
  // DIRECTOR FORM
  // =============================
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  // =============================
  // INSTITUTE FORM
  // =============================
  const {
    register: registerInstitute,
    handleSubmit: handleInstituteSubmit,
    reset: resetInstitute,
  } = useForm();

  // =============================
  // PASSWORD FORM
  // =============================
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
  } = useForm();

  // =============================
  // FETCH PROFILE
  // =============================
  const fetchProfile = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/profile`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (data.success) {
        const d = data.data;
        setDirector(d);

        // Reset Director Form
        reset({
          firstName: d.firstName || "",
          lastName: d.lastName || "",
          phone: d.phone || "",
          gender: d.gender || "",
          email: d.email || "",
          dateOfBirth: d.dateOfBirth?.slice(0, 10) || "",
          joiningDate: d.joiningDate?.slice(0, 10) || "",
        });

        // Reset Institute Form
        resetInstitute({
          name: d.institute?.name || "",
          code: d.institute?.code || "",
          address: d.institute?.address || "",
          establishedYear: d.institute?.establishedYear || "",

          attendanceThreshold:
            d.institute?.academicPolicy?.attendanceThreshold || 75,

          passingMarks:
            d.institute?.academicPolicy?.passingMarks || 40,

          Assignment:
            d.institute?.academicPolicy?.assessmentWeightage?.Assignment || 10,

          Quiz:
            d.institute?.academicPolicy?.assessmentWeightage?.Quiz || 10,

          Midterm:
            d.institute?.academicPolicy?.assessmentWeightage?.Midterm || 30,

          Final:
            d.institute?.academicPolicy?.assessmentWeightage?.Final || 50,
        });
      }
    } catch (err) {
      toast.error("Failed to load profile");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // =============================
  // UPDATE DIRECTOR
  // =============================
  const onSubmit = async (formData) => {
    const promise = fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/profile`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      }
    ).then((res) => res.json());

    toast.promise(promise, {
      loading: "Updating profile...",
      success: (data) => {
        if (!data.success) throw new Error(data.message);
        fetchProfile();
        return "Profile updated successfully";
      },
      error: (err) => err.message || "Update failed",
    });
  };

  // =============================
  // UPDATE INSTITUTE + POLICY
  // =============================
  const onInstituteSubmit = async (formData) => {
    const payload = {
      name: formData.name,
      code: formData.code,
      address: formData.address,
      establishedYear: Number(formData.establishedYear),

      academicPolicy: {
        attendanceThreshold: Number(formData.attendanceThreshold),
        passingMarks: Number(formData.passingMarks),
        assessmentWeightage: {
          Assignment: Number(formData.Assignment),
          Quiz: Number(formData.Quiz),
          Midterm: Number(formData.Midterm),
          Final: Number(formData.Final),
        },
      },
    };

    const promise = fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/profile/institute`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      }
    ).then((res) => res.json());

    toast.promise(promise, {
      loading: "Updating institute...",
      success: (data) => {
        if (!data.success) throw new Error(data.message);
        fetchProfile();
        return "Institute & academic policy updated successfully";
      },
      error: (err) => err.message || "Failed to update institute",
    });
  };

  // =============================
  // CHANGE PASSWORD
  // =============================
  const onPasswordSubmit = async (formData) => {
    const promise = fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/director/profile/change-password`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      }
    ).then((res) => res.json());

    toast.promise(promise, {
      loading: "Changing password...",
      success: (data) => {
        if (!data.success) throw new Error(data.message);
        resetPassword();
        return "Password changed successfully";
      },
      error: (err) => err.message || "Failed to change password",
    });
  };

  return (
    <div className="bg-background min-h-screen p-4 space-y-6 text-main">

      {/* Director Profile */}
      <div className="bg-card p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Director Profile</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input name="firstName" label="First Name" register={register} />
          <Input name="lastName" label="Last Name" register={register} />
          <Input name="phone" label="Phone" register={register} />
          <Input name="gender" label="Gender" register={register} />
          <Input name="email" label="Email" register={register} disabled />
          <Input name="dateOfBirth" type="date" label="Date of Birth" register={register} />
          <Input name="joiningDate" type="date" label="Joining Date" register={register} />

          <Button type="submit" className="w-full">
            Update Profile
          </Button>
        </form>
      </div>

      {/* Institute & Academic Policy */}
      <div className="bg-card p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Institute & Academic Policy</h2>

        <form onSubmit={handleInstituteSubmit(onInstituteSubmit)} className="space-y-4">

          <Input name="name" label="Institute Name" register={registerInstitute} />
          <Input name="code" label="Code" register={registerInstitute} />
          <Input name="address" label="Address" register={registerInstitute} />
          <Input name="establishedYear" label="Established Year" register={registerInstitute} />

          <hr className="my-4 border-gray-300" />

          <h3 className="font-semibold">Academic Policy</h3>

          <Input name="attendanceThreshold" type="number" label="Attendance Threshold (%)" register={registerInstitute} />
          <Input name="passingMarks" type="number" label="Passing Marks (%)" register={registerInstitute} />

          <h4 className="font-medium mt-4">Assessment Weightage (%)</h4>

          <Input name="Assignment" type="number" label="Assignment" register={registerInstitute} />
          <Input name="Quiz" type="number" label="Quiz" register={registerInstitute} />
          <Input name="Midterm" type="number" label="Midterm" register={registerInstitute} />
          <Input name="Final" type="number" label="Final" register={registerInstitute} />

          <Button type="submit" className="w-full">
            Update Institute
          </Button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-card p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <Input name="currentPassword" type="password" label="Current Password" register={registerPassword} />
          <Input name="newPassword" type="password" label="New Password" register={registerPassword} />

          <Button type="submit" className="w-full">
            Change Password
          </Button>
        </form>
      </div>

    </div>
  );
};

export default Profile;