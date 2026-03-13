import { FaFileUpload, FaPlus, FaTrash } from "react-icons/fa";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import Button from "../../components/common/Button";
import { useGetAllVouchers, useDeleteVoucher } from "../../hooks/useVoucher";
import { IVoucher } from "../../types/interfaces";
import UpsertVoucherModal from "../../components/orgAdmin/UpsertVoucherModal";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Dialog from "../../components/common/Dialog";
import BulkCreateVoucherModal from "../../components/orgAdmin/BulkCreateVoucher";
import VoucherSkeleton from "../../components/skeleton/VoucherSkeleton";

export default function Vouchers() {
  const { data, isPending } = useGetAllVouchers();
  const vouchers = data?.data || [];
  const [searchParams, setSearchParams] = useSearchParams();
  const modal = searchParams.get("modal");
  const deleteVoucherId = searchParams.get("deleteVoucherId");

  const deleteVoucher = useDeleteVoucher();

  const handleVoucherClick = (voucherId: string) => {
    setSearchParams({ modal: "edit-voucher", voucherId });
  };

  const handleCreateVoucher = () => {
    setSearchParams({ modal: "create-voucher" });
  };

  const handleBulkCreateVoucher = () => {
    setSearchParams({ modal: "bulk-create-voucher" });
  };

  const handleDeleteClick = (voucherId: string) => {
    setSearchParams({ modal: "delete-voucher", deleteVoucherId: voucherId });
  };

  const handleConfirmDelete = () => {
    if (deleteVoucherId) {
      toast.promise(
        deleteVoucher.mutateAsync(deleteVoucherId, {
          onSuccess: () => {
            setSearchParams({});
          },
          onError: (error) => {
            console.error("Error deleting voucher:", error);
          },
        }),
        {
          pending: "Deleting voucher...",
          success: "Voucher deleted successfully",
          error: "Failed to delete voucher",
        }
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto pt-16 pb-6 px-6 lg:py-8 lg:px-8">
      <h1 className="text-3xl font-bold mb-2">Vouchers</h1>

      <div className="flex items-center justify-between gap-2 py-6">
        {/* Search Input */}
        <div className="flex-1 min-w-[120px]">
          <input
            type="text"
            placeholder="Search voucher..."
            className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3E5B93]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleCreateVoucher}
            className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm sm:text-base"
          >
            <FaPlus className="sm:mr-2" />
            <span className="hidden sm:inline">Create</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleBulkCreateVoucher}
            className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm sm:text-base"
          >
            <FaFileUpload className="sm:mr-2" />
            <span className="hidden sm:inline">Bulk Import</span>
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {isPending ? (
          <VoucherSkeleton />
        ) : vouchers.length === 0 ? (
          <p>No vouchers available.</p>
        ) : (
          vouchers.map((voucher: IVoucher) => (
            <div
              key={voucher.code}
              className="relative w-full sm:w-[600px] mx-auto bg-blue-900 text-white rounded-lg p-4 sm:p-6 shadow-lg flex flex-col justify-between overflow-hidden hover:shadow-2xl transition-all cursor-pointer group"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='M0 100 Q 25 0 50 100 T 100 0 V 100 H 0 Z' fill='rgba(255,255,255,0.1)'/%3E%3C/svg%3E")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              onClick={() => handleVoucherClick(voucher._id)}
            >
              <button
                className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(voucher._id);
                }}
                title="Delete voucher"
              >
                <FaTrash />
              </button>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  {voucher.name}{" "}
                  <span className="text-lg sm:text-xl">
                    ({voucher.discount}% off)
                  </span>
                </h2>
                <p className="text-sm font-medium mt-1">Code: {voucher.code}</p>
                <p className="text-sm opacity-80 mt-2 line-clamp-2 sm:line-clamp-none">
                  {voucher.description}
                </p>
              </div>
              <div className="mt-4 sm:mt-6">
                <p className="text-xs flex items-center">
                  <span className="mr-1 text-blue-300">ⓘ</span> EXPIRY:{" "}
                  {formatDateMMMDDYYY(voucher.expiryDate, true)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      {(modal === "create-voucher" || modal === "edit-voucher") && (
        <UpsertVoucherModal
          isOpen={modal === "create-voucher" || modal === "edit-voucher"}
          onClose={() => setSearchParams({})}
        />
      )}
      {modal === "delete-voucher" && deleteVoucherId && (
        <Dialog
          title="Confirm Delete Voucher"
          backdrop="blur"
          isOpen={modal === "delete-voucher"}
          onClose={() => setSearchParams({})}
          size="md"
          contentClassName="w-[400px]"
        >
          <div className="space-y-6">
            <p className="text-gray-700">
              Are you sure you want to delete this voucher? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                variant="cancel"
                type="button"
                onClick={() => setSearchParams({})}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteVoucher.isPending}
                isLoading={deleteVoucher.isPending}
                isLoadingText="Deleting..."
              >
                Delete
              </Button>
            </div>
          </div>
        </Dialog>
      )}
      {modal === "bulk-create-voucher" && (
        <BulkCreateVoucherModal
          isOpen={modal === "bulk-create-voucher"}
          onClose={() => setSearchParams({})}
        />
      )}
    </div>
  );
}
