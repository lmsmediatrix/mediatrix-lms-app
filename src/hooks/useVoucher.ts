import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import VoucherService from "../services/voucherApi";
import { ApiParams } from "../types/params";

export const useGetVoucherById = (voucherId: string) => {
  return useQuery({
    queryKey: ["voucher-by-id", voucherId],
    queryFn: async () => {
      VoucherService.select([
        "name",
        "code",
        "description",
        "discount",
        "expiryDate",
        "providerName",
      ]);

      return VoucherService.getVoucherById(voucherId);
    },
  });
};

export const useGetAllVouchers = () => {
  return useQuery({
    queryKey: ["all-vouchers"],
    queryFn: async () => {
      VoucherService.select([
        "name",
        "code",
        "description",
        "discount",
        "expiryDate",
      ])
        .withDocument(true)
        .withPagination(true);

      return VoucherService.getAllVouchers();
    },
  });
};

export const useCreateVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return VoucherService.createVoucher(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-vouchers"] });
    },
  });
};

export const useDeleteVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (voucherId: string) => VoucherService.deleteVoucher(voucherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-vouchers"] });
    },
  });
};

export const useUpdateVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return VoucherService.updateVoucher(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["voucher-by-id"] });
    },
    onError: (error) => {
      console.error("Failed to update voucher:", error);
    },
  });
};

export const useSearchVoucher = (apiParams?: Partial<ApiParams>) => {
  return useQuery({
    queryKey: ["search-voucher", apiParams],
    queryFn: async () => {
      VoucherService.resetQuery();
      return VoucherService.select(["name", "code", "updatedAt"])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .where(
          apiParams?.filter
            ? { [apiParams.filter.key as string]: apiParams.filter.value }
            : {}
        )
        .search(["name", "code"], apiParams?.searchTerm || "")
        .withDocument(true)
        .withPagination(true)
        .searchVoucher();
    },
  });
};

export const useBulkCreateVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: object) => {
      return VoucherService.bulkCreateVoucher(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-vouchers"] });
    },
  });
};
