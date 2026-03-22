"use client"

import { useEffect, useState, useRef} from "react"
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { Trash, SquarePen } from "lucide-react"
import toast from "react-hot-toast"

const Assessments = () => {
  const { sectionId } = useParams()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm()

  const formRef = useRef(null)

  const [assessments, setAssessments] = useState([])
  const [editing, setEditing] = useState(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  // =============================
  // FETCH
  // =============================
  const fetchAssessments = async (currentPage = 1) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/sections/${sectionId}/assessments?page=${currentPage}&limit=${limit}`,
        { credentials: "include" }
      )

      const data = await res.json()

      if (!data.success) throw new Error(data.message)

      setAssessments(data.data)
      setTotalPages(data.pagination?.totalPages || 1)

    } catch (err) {
      toast.error(err.message)
    }
  }

  useEffect(() => {
    fetchAssessments(page)
  }, [page])

  // =============================
  // CREATE / UPDATE
  // =============================
  const onSubmit = async (formData) => {
    try {
      const url = editing
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/sections/${sectionId}/assessments/${editing._id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/sections/${sectionId}/assessments`

      const method = editing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!data.success) {
        setError("root", { message: data.message })
        return
      }

      toast.success(editing ? "Updated" : "Created")

      reset()
      setEditing(null)
      fetchAssessments(page)

    } catch {
      setError("root", { message: "Network error" })
    }
  }

  // =============================
  // EDIT
  // =============================
  const handleEdit = (item) => {
    setEditing(item)

    setValue("title", item.title)
    setValue("type", item.type)
    setValue("totalMarks", item.totalMarks)
    setValue("date", item.date?.split("T")[0])

    formRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // =============================
  // DELETE
  // =============================
  const handleDelete = async (item) => {
    if (!confirm("Delete this assessment?")) return

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/sections/${sectionId}/assessments/${item._id}`,
      {
        method: "DELETE",
        credentials: "include"
      }
    )

    const data = await res.json()

    if (!data.success) {
      toast.error(data.message)
      return
    }

    toast.success("Deleted")
    fetchAssessments(page)
  }

  // =============================
  // UI
  // =============================
  return (
    <div className="bg-background text-main min-h-screen p-2 space-y-6">

      {/* FORM */}
      <div ref={formRef} className="bg-card p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-center mb-4">
          {editing ? "Edit Assessment" : "Create Assessment"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <Input
            label="Title"
            placeholder="Enter Assessment Name."
            register={register}
            {...register("title", { required: "Assessment's title is required" })}
            error={errors.title?.message}
          />

          {/* TYPE (SELECT) */}
          <div>
            <label className="block mb-1 text-sm font-medium">
              Assessment Type
            </label>

            <select
              className="w-full p-2 rounded-md bg-card border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              {...register("type", {
                required: "Assessment's type is required"
              })}
            >
              <option value="">Select Type</option>
              <option value="Assignment">Assignment</option>
              <option value="Quiz">Quiz</option>
              <option value="Midterm">Midterm</option>
              <option value="Final">Final</option>
            </select>

            {errors.type && (
              <p className="text-red-500 text-sm mt-1">
                {errors.type.message}
              </p>
            )}
          </div>

          <Input
            type="number"
            label="Total Marks"
            register={register}
            {...register("totalMarks", { required: "Assessment's total marks is required" })}
            error={errors.totalMarks?.message}
          />

          <Input
            type="date"
            label="Date"
            register={register}
            {...register("date", { required: "Assessment's date is required" })}
            error={errors.date?.message}
          />

          <Button type="submit" className="w-full">
            {isSubmitting
              ? "Saving..."
              : editing ? "Update" : "Create"}
          </Button>

          {editing && (
            <Button
              variant="danger"
              className="w-full"
              onClick={() => {
                reset()
                setEditing(null)
              }}
            >
              Cancel Edit
            </Button>
          )}

          {errors.root && (
            <p className="text-red-500 text-center">
              {errors.root.message}
            </p>
          )}

        </form>
      </div>

      {/* TABLE */}
      <div className="bg-card rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary text-white">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Type</th>
              <th className="p-3">Marks</th>
              <th className="p-3">Date</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {assessments.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  No assessments found
                </td>
              </tr>
            ) : (
              assessments.map(a => (
                <tr key={a._id} className="border-b hover:bg-[rgb(var(--secondary))]">
                  <td className="p-3 text-center">{a.title}</td>
                  <td className="p-3 text-center">{a.type}</td>
                  <td className="p-3 text-center">{a.totalMarks}</td>
                  <td className="p-3 text-center">
                    {new Date(a.date).toLocaleDateString()}
                  </td>

                  <td className="flex gap-3 justify-center p-3">
                    <Button size="sm" onClick={() => handleEdit(a)}>
                      <SquarePen size={16} />
                    </Button>

                    <Button variant="danger" size="sm" onClick={() => handleDelete(a)}>
                      <Trash size={16} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center items-center gap-4">
        <Button
          variant="secondary"
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Prev
        </Button>

        <span>Page {page} / {totalPages}</span>

        <Button
          variant="secondary"
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </div>

    </div>
  )
}

export default Assessments