"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Button from "@/components/ui/Button"
import toast from "react-hot-toast"

const AttendanceEntry = () => {
    const { sectionId, attendanceId } = useParams()
    const router = useRouter()

    const [attendance, setAttendance] = useState(null)
    const [records, setRecords] = useState({})
    const [loading, setLoading] = useState(true)

    // =============================
    // FETCH ATTENDANCE BY ID
    // =============================
    const fetchAttendance = async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/sections/${sectionId}/attendance/${attendanceId}`,
                { credentials: "include" }
            )

            const data = await res.json()

            if (!data.success) throw new Error(data.message)

            setAttendance(data.data)

            // Convert records → map
            const map = {}
            data.data.records.forEach(r => {
                map[r.student._id] = r.status
            })

            setRecords(map)

        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (sectionId && attendanceId) fetchAttendance()
    }, [sectionId, attendanceId])

    // =============================
    // TOGGLE STATUS
    // =============================
    const toggleStatus = (studentId) => {
        setRecords(prev => ({
            ...prev,
            [studentId]:
                prev[studentId] === "present" ? "absent" : "present"
        }))
    }

    // =============================
    // SAVE
    // =============================
    const handleSave = async () => {
        try {
            const payload = Object.keys(records).map(id => ({
                studentId: id,
                status: records[id]
            }))

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/sections/${sectionId}/attendance`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        date: attendance.date,
                        records: payload
                    })
                }
            )

            const data = await res.json()

            if (!data.success) throw new Error(data.message)

            toast.success("Attendance saved")

        } catch (err) {
            toast.error(err.message)
        }
    }

    // =============================
    // UI
    // =============================
    if (loading) {
        return <div className="text-center p-4">Loading...</div>
    }

    return (
        <div className="bg-background text-main min-h-screen p-2 space-y-6">

            {/* HEADER */}
            <div className="bg-card p-4 rounded-lg shadow flex justify-between items-center">

                <Button
                    variant="danger"
                    onClick={() => router.back()}
                >
                    Back
                </Button>

                <div className="text-center">
                    <h2 className="font-semibold text-lg">
                        {new Date(attendance.date).toLocaleDateString()}
                    </h2>
                    <p className="text-sm text-muted">
                        Mark Attendance
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="danger"
                        onClick={() => fetchAttendance()}
                    >
                        Cancel
                    </Button>

                    <Button onClick={handleSave}>
                        Save
                    </Button>
                </div>

            </div>

            {/* STUDENTS LIST */}
            <div className="bg-card rounded-lg shadow overflow-x-auto">

                <table className="w-full">

                    <thead className="bg-primary text-white">
                        <tr>
                            <th className="p-3">Roll No</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        {attendance.records.length === 0 ? (
                            <tr className="border-b">
                                <td className="p-3 text-center" colSpan={3}>
                                    No students found in this section
                                </td>
                            </tr>
                        ) : (attendance.records.map(r => (
                            <tr
                                key={r.student._id}
                                className="border-b hover:bg-[rgb(var(--secondary))]"
                            >

                                <td className="p-3 text-center">
                                    {r.student.rollNo}
                                </td>

                                <td className="p-3 text-center">
                                    {r.student.firstName} {r.student.lastName}
                                </td>

                                <td className="p-3 text-center">

                                    <button
                                        onClick={() =>
                                            toggleStatus(r.student._id)
                                        }
                                        className={`px-4 py-1 rounded text-white ${records[r.student._id] === "present"
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                            }`}
                                    >
                                        {records[r.student._id] || "absent"}
                                    </button>

                                </td>

                            </tr>
                        )))}
                    </tbody>

                </table>

            </div>

        </div>
    )
}

export default AttendanceEntry