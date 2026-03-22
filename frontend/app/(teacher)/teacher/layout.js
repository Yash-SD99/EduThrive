import Navbar from "./Components/Navbar/page"
import Sidebar from "./Components/Sidebar/page"

export default function TeacherLayout({ children }) {
	return (
		<div className="flex min-h-screen bg-background text-main">
			<Sidebar />

			<div className="w-screen">
				<Navbar />
				<main className="p-2">
					{children}
				</main>

			</div>

		</div>
	)
}