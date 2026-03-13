import { useState } from "react";
import AssessmentGradeTable from "../../components/instructor/grades/AssessmentGradeTable";
import GradeInputForm from "../../components/instructor/grades/GradeInputForm";

const AssessmentGradesPage: React.FC = () => {
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudentId, setNewStudentId] = useState<string>("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAssessmentId(inputValue.trim());
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">
          Assessment Grades
        </h1>

        <form onSubmit={handleSearch} className="mb-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Assessment ID
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter Assessment ID..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            Load Grades
          </button>
        </form>

        {assessmentId && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-700">
                Grade Records
              </h2>
              <button
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
                onClick={() => setShowAddForm((prev) => !prev)}
              >
                {showAddForm ? "Cancel" : "+ Add Grade"}
              </button>
            </div>

            {showAddForm && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    placeholder="Enter Student ID..."
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
                {newStudentId && (
                  <GradeInputForm
                    assessmentId={assessmentId}
                    studentId={newStudentId}
                    onClose={() => {
                      setShowAddForm(false);
                      setNewStudentId("");
                    }}
                  />
                )}
              </div>
            )}

            <AssessmentGradeTable assessmentId={assessmentId} />
          </>
        )}

        {!assessmentId && (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 py-20">
            <p className="text-gray-400 text-sm">
              Enter an Assessment ID above to view and manage grades.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentGradesPage;
