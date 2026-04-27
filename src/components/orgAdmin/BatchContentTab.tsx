import { useState } from "react";
import Button from "../common/Button";
import BatchContentBuilderModal from "./BatchContentBuilderModal";

interface BatchContentTabProps {
  sectionCode: string;
}

export default function BatchContentTab({ sectionCode }: BatchContentTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-white md:shadow rounded-lg max-w-5xl mx-auto p-6 space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-800">Batch Builder</h2>
        <p className="text-sm text-gray-600">
          Create nested module, lesson, and assessment content for this section
          in one run.
        </p>
        <p className="text-xs text-gray-500">
          v1 supports text-only lesson content and question text. File and image
          uploads are not supported in batch mode.
        </p>
      </div>

      <Button variant="outline" onClick={() => setIsModalOpen(true)}>
        Open Batch Builder
      </Button>

      <BatchContentBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sectionCode={sectionCode}
      />
    </div>
  );
}
