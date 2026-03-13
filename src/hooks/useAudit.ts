import { useMutation, useQuery } from "@tanstack/react-query";
import auditService from "../services/auditApi";
import { ApiParams } from "../types/params";

export const useGetAllAudits = (apiParams?: Partial<ApiParams>) => {
  return useQuery({
    queryKey: ["all-audits", apiParams],
    queryFn: async () => {
      auditService.resetQuery();
      return auditService
        .select([
          "user",
          "type",
          "severity",
          "entity",
          "changes",
          "description",
          "timestamp"
        ])
        .sort("-timestamp")
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .where(
          apiParams?.filter
            ? { [apiParams.filter.key as string]: apiParams.filter.value }
            : {}
        )
        .search(
          ["type", "severity", "entity", "description"],
          apiParams?.searchTerm || ""
        )
        .withPagination(true)
        .withDocument(true)
        .withCount(true)
        .populate([
          {
            path: "userId",
            select: "",
          },

        ])
        .getAllAudits();
    },
  });
};

export const useGetAuditById = (auditId: string) => {
  return useQuery({
    queryKey: ["audit-by-id", auditId],
    queryFn: async () => {
      auditService.resetQuery();
      return auditService
        .select([
          "user",
          "type",
          "severity",
          "entity",
          "changes",
          "description",
          "timestamp"
        ])
        .populate([
          {
            path: "userId",
            select: "",
          },

        ])
        .getAuditById(auditId);
    },
    enabled: !!auditId,
  });
};

export const useSearchAudit = (apiParams?: Partial<ApiParams>) => {
  return useQuery({
    queryKey: ["search-audits", apiParams],
    queryFn: async () => {
      auditService.resetQuery();
      const searchParams = {
        query: apiParams?.filter
          ? { [apiParams.filter.key as string]: apiParams.filter.value }
          : {},
        search: apiParams?.searchTerm
          ? {
              fields: ["type", "severity", "entity", "description"],
              term: apiParams.searchTerm,
            }
          : undefined,
        populateArray: [
          {
            path: "user",
            select: "firstName lastName email",
          },

        ],
        sort: apiParams?.sort || "-timestamp",
        select:
          "user type severity entity changes metadata description timestamp",
        skip: apiParams?.skip || 0,
        limit: apiParams?.limit || 10,
        count: true,
        pagination: true,
        document: true,
      };

      return await auditService.addFields(searchParams).searchAudit();
    },
  });
};

export const useExportAuditLog = () => {
  return useMutation({
    mutationFn: async (apiParams?: Partial<ApiParams>) => {
      auditService.resetQuery();
      return auditService
        .select([
          "user",
          "type",
          "severity",
          "entity",
          "changes",
          "description",
          "organizationId",
          "timestamp"
        ])
        .limit(apiParams?.limit || 10)
        .skip(apiParams?.skip || 0)
        .populate([
          { path: "organizationId", select: "" },
        ])
        .exportAuditLogs();
    },
  });
};