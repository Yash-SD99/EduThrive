"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Button from "@/components/ui/Button"
import toast from "react-hot-toast"

const MarksEntry = () => {
    const { sectionId, assessmentId } = useParams()
    const router = useRouter()

    const [assessment, setAssessment] = useState(null)
    const [students, setStudents] = useState([])
    const [marks, setMarks] = useState({})
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const limit = 10

    // =============================
    // FETCH Assessments
    // =============================
    const fetchAssessmentDetails = async () => {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/sections/${sectionId}/assessments/${assessmentId}`,
            { credentials: "include" }
        )

        const data = await res.json()

        if (data.success) {
            setAssessment(data.data)
        }
    }

    // =============================
    // FETCH STUDENTS
    // =============================
    const fetchStudents = async (currentPage = 1) => {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/sections/${sectionId}/students?page=${currentPage}&limit=${limit}`,
            { credentials: "include" }
        )

        const data = await res.json()

        if (data.success) {
            setStudents(data.data)
            setTotalPages(data.pagination?.totalPages || 1)
        }
    }

    // =============================
    // FETCH MARKS
    // =============================
    const fetchMarks = async () => {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/sections/${sectionId}/assessments/${assessmentId}/marks`,
            { credentials: "include" }
        )

        const data = await res.json()

        if (data.success) {
            const map = {}
            data.data.forEach(m => {
                map[m.student._id] = m.marksObtained
            })
            setMarks(map)
        }
    }

    useEffect(() => {
        fetchStudents(page)
    }, [page])

    useEffect(() => {
        fetchMarks()
        if (assessmentId) {
            fetchAssessmentDetails()
        }
    }, [assessmentId])

    // =============================
    // HANDLE CHANGE
    // =============================
    const handleChange = (id, value) => {
        setMarks(prev => ({
            ...prev,
            [id]: value === "" ? "" : Number(value)
        }))
    }

    // =============================
    // SAVE
    // =============================
    const handleSave = async () => {
        const payload = Object.keys(marks).map(id => ({
            studentId: id,
            marksObtained: Number(marks[id])
        }))

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/sections/${sectionId}/assessments/${assessmentId}/marks`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ marks: payload })
            }
        )

        const data = await res.json()

        if (!data.success) {
            toast.error(data.message)
            return
        }

        toast.success("Marks saved")
    }

    return (
        <div className="p-2 space-y-6">

            {/* ACTIONS */}
            <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-lg shadow">

                {/* LEFT SIDE */}
                <div className="flex items-center gap-3">

                    {/* BACK */}
                    <Button onClick={() => router.back()}>
                        Back
                    </Button>

                    {/* ASSESSMENT INFO */}
                    {assessment && (
                        <div className="flex flex-col">
                            <p className="font-semibold text-main">
                                {assessment.title}
                            </p>
                            <p className="text-sm text-muted">
                                Max Marks: {assessment.totalMarks}
                            </p>
                        </div>
                    )}

                </div>

                {/* RIGHT SIDE */}
                <div className="ml-auto flex items-center gap-4">

                    <Button variant="danger" onClick={() => fetchMarks()}>
                        Cancel
                    </Button>

                    <Button onClick={handleSave}>
                        Save
                    </Button>

                </div>

            </div>

            {/* TABLE */}
            <div className="bg-card rounded-lg shadow overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-primary text-white">
                        <tr>
                            <th className="p-3">Roll No</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Marks</th>
                        </tr>
                    </thead>

                    <tbody>
                        {students.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-3 text-center">
                                    No students found
                                </td>
                            </tr>
                        )}
                        {students.map(s => (
                            <tr key={s._id} className="border-b hover:bg-[rgb(var(--secondary))]">

                                <td className="p-3 text-center">{s.rollNo}</td>

                                <td className="p-3 text-center">
                                    {s.firstName} {s.lastName}
                                </td>

                                <td className="p-3 text-center">
                                    <input
                                        type="number"
                                        value={marks[s._id] ?? ""}
                                        onChange={(e) => handleChange(s._id, e.target.value)}
                                        className="w-[100px] p-1 border rounded text-center bg-background"
                                    />
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-center gap-4">
                <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    Prev
                </Button>

                <span>Page {page} / {totalPages}</span>

                <Button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    Next
                </Button>
            </div>

        </div>
    )
}

export default MarksEntry