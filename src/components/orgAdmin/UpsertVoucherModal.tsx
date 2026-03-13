import { useEffect } from "react";
import Dialog from "../common/Dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateVoucher,
  useGetVoucherById,
  useUpdateVoucher,
} from "../../hooks/useVoucher";
import Button from "../common/Button";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getMaxDate } from "../../lib/maxDateUtils";

// Zod schema for voucher form validation
const voucherSchema = z.object({
  name: z
    .string()
    .min(1, "Voucher name must be at least 1 character")
    .max(100, "Voucher name must be at most 100 characters"),
  code: z
    .string()
    .min(1, "Voucher code is required")
    .max(50, "Voucher code must be at most 50 characters"),
  providerName: z
    .string()
    .min(1, "Provider name must be at least 1 character")
    .max(100, "Provider name must be at most 100 characters"),
  description: z
    .string()
    .min(1, "Description must be at least 1 character")
    .max(500, "Description cannot exceed 500 characters"),
  discount: z
    .number({ invalid_type_error: "Discount must be a number" })
    .min(1, "Discount must be at least 1%")
    .max(100, "Discount cannot exceed 100%"),
  expiryDate: z.string().min(1, "Expiry date is required"),
});

type VoucherFormData = z.infer<typeof voucherSchema>;

interface UpsertVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpsertVoucherModal({
  isOpen,
  onClose,
}: UpsertVoucherModalProps) {
  const [searchParams] = useSearchParams();
  const createVoucher = useCreateVoucher();
  const updateVoucher = useUpdateVoucher();
  const voucherId = searchParams.get("voucherId");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setValue,
  } = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      name: "",
      code: "",
      providerName: "",
      description: "",
      discount: 1,
      expiryDate: "",
    },
  });

  const { data: voucher, isPending: isVoucherLoading } = useGetVoucherById(
    voucherId ? voucherId : ""
  );

  const shouldShowLoading = voucherId && isVoucherLoading;

  useEffect(() => {
    if (voucher) {
      setValue("name", voucher.data.name);
      setValue("code", voucher.data.code);
      setValue("providerName", voucher.data.providerName || "");
      setValue("description", voucher.data.description);
      setValue("discount", voucher.data.discount);
      const expiryDate = new Date(voucher.data.expiryDate)
        .toISOString()
        .split("T")[0];
      setValue("expiryDate", expiryDate);
    }
  }, [voucher, setValue]);

  const onSubmit = async (data: VoucherFormData) => {
    const formData = {
      ...data,
      ...(voucherId && { _id: voucherId }),
    };
    const mutation = voucherId ? updateVoucher : createVoucher;
    toast.promise(
      mutation.mutateAsync(formData, {
        onSuccess: () => {
          reset();
          onClose();
        },
        onError: (error) => {
          console.error("Error processing voucher:", error);
        },
      }),
      {
        pending: voucherId ? "Updating voucher..." : "Creating voucher...",
        success: voucherId
          ? "Voucher updated successfully"
          : "Voucher created successfully",
        error: {
          render({ data }) {
            return (data as { message: string }).message;
          },
        },
      }
    );
  };

  return (
    <Dialog
      title={voucherId ? "Edit Voucher" : "Create Voucher"}
      backdrop="blur"
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      contentClassName="w-full md:w-[40vw] md:min-w-[500px] max-w-[800px]"
    >
      {shouldShowLoading ? (
        <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-[76px] bg-gray-200 rounded"></div>
              <div className="h-[76px] bg-gray-200 rounded"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-[76px] bg-gray-200 rounded"></div>
              <div className="h-[76px] bg-gray-200 rounded"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-[76px] bg-gray-200 rounded"></div>
              <div className="h-[76px] bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="h-[100px] bg-gray-200 rounded"></div>
          <div className="flex justify-end space-x-4">
            <div className="w-24 h-10 bg-gray-200 rounded"></div>
            <div className="w-24 h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 max-w-6xl mx-auto"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Voucher Name
                </label>
                <input
                  className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.name ? "border-red-500 border" : ""
                  }`}
                  type="text"
                  id="name"
                  {...register("name")}
                  minLength={1}
                  maxLength={100}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700"
                >
                  Voucher Code
                </label>
                <input
                  className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.code ? "border-red-500" : "border-gray-300"
                  }`}
                  type="text"
                  id="code"
                  {...register("code")}
                  minLength={1}
                  maxLength={50}
                  disabled={isSubmitting}
                />
                {errors.code && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.code.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="discount"
                  className="block text-sm font-medium text-gray-700"
                >
                  Discount (%)
                </label>
                <input
                  className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.discount ? "border-red-500" : "border-gray-300"
                  }`}
                  type="number"
                  id="discount"
                  {...register("discount", { valueAsNumber: true })}
                  min={1}
                  max={100}
                  disabled={isSubmitting}
                />
                {errors.discount && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.discount.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="expiryDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Expiry Date
                </label>
                <input
                  className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.expiryDate ? "border-red-500" : "border-gray-300"
                  }`}
                  type="date"
                  id="expiryDate"
                  {...register("expiryDate")}
                  max={getMaxDate()}
                  onChange={(e) => {
                    if (new Date(e.target.value) > new Date(getMaxDate())) {
                      e.target.value = getMaxDate();
                    }
                  }}
                  disabled={isSubmitting}
                />
                {errors.expiryDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.expiryDate.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="providerName"
                className="block text-sm font-medium text-gray-700"
              >
                Provider Name
              </label>
              <input
                className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.providerName ? "border-red-500 border" : ""
                }`}
                type="text"
                id="providerName"
                {...register("providerName")}
                minLength={1}
                maxLength={100}
                disabled={isSubmitting}
              />
              {errors.providerName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.providerName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              className={`p-2 mt-1 block w-full rounded-md bg-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              id="description"
              rows={4}
              {...register("description")}
              minLength={1}
              maxLength={500}
              disabled={isSubmitting}
              placeholder="Enter voucher description"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              onClick={() => {
                onClose();
                reset();
              }}
              variant="cancel"
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={
                isSubmitting ||
                createVoucher.isPending ||
                updateVoucher.isPending ||
                !isDirty
              }
              isLoadingText={voucherId ? "Updating..." : "Saving..."}
              isLoading={
                voucherId ? updateVoucher.isPending : createVoucher.isPending
              }
            >
              {voucherId ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
