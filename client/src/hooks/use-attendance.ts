import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertAttendance } from "@shared/routes";

// GET /api/attendance
export function useAttendance() {
  return useQuery({
    queryKey: [api.attendance.list.path],
    queryFn: async () => {
      const res = await fetch(api.attendance.list.path);
      if (!res.ok) throw new Error("Failed to fetch attendance logs");
      return api.attendance.list.responses[200].parse(await res.json());
    },
  });
}

// POST /api/attendance
export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertAttendance) => {
      const res = await fetch(api.attendance.create.path, {
        method: api.attendance.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
         if (res.status === 400) {
          const error = api.attendance.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to mark attendance");
      }
      
      return api.attendance.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attendance.list.path] });
    },
  });
}
