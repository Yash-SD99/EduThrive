import Navbar from "./Components/Navbar/Page"
import Sidebar from "./Components/Sidebar/Page"

export default function DirectorLayout({ children }) {
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