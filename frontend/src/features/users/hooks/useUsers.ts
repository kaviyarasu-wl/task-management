import { useQuery } from '@tanstack/react-query';
import { userApi } from '../services/userApi';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });
}

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: () => userApi.getMembers(),
  });
}

export function useTenant() {
  return useQuery({
    queryKey: ['tenant'],
    queryFn: () => userApi.getTenant(),
  });
}
