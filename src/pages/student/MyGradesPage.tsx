import { useState } from "react";
import MyAssessmentGrades from "../../components/student/grades/MyAssessmentGrades";

interface MyGradesPageProps {
  studentId: string;
}

const MyGradesPage: React.FC<MyGradesPageProps> = ({ studentId }) => {
  const [sectionId, setSectionId] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSectionId(inputValue.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">My Grades</h1>

        <form onSubmit={handleSearch} className="mb-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Section ID
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter Section ID to view grades..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            View Grades
          </button>
        </form>

        {sectionId ? (
          <MyAssessmentGrades studentId={studentId} sectionId={sectionId} />
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 py-20">
            <p className="text-gray-400 text-sm">
              Enter a Section ID above to view your assessment grades.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGradesPage;
