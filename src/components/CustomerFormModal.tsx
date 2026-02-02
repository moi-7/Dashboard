import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form@7.55.0';
import { Modal } from './Modal';
import { Loader2 } from 'lucide-react';

export interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => void;
  initialData?: CustomerFormData | null;
  isEditing?: boolean;
}

export function CustomerFormModal({ isOpen, onClose, onSubmit, initialData, isEditing = false }: CustomerFormModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<CustomerFormData>();

  useEffect(() => {
    if (isOpen && initialData) {
      setValue('firstName', initialData.firstName);
      setValue('lastName', initialData.lastName);
      setValue('email', initialData.email);
      setValue('phone', initialData.phone);
      setValue('role', initialData.role);
    } else if (isOpen && !initialData) {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'Lead'
      });
    }
  }, [isOpen, initialData, setValue, reset]);

  const handleFormSubmit = async (data: CustomerFormData) => {
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 600));
    onSubmit(data);
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? "Edit Customer" : "Add New Customer"}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">First name</label>
            <input
              id="firstName"
              {...register("firstName", { required: "First name is required" })}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white dark:bg-gray-800 dark:text-white ${errors.firstName ? 'border-red-300 dark:border-red-800' : 'border-gray-200 dark:border-gray-700'}`}
              placeholder="Jane"
            />
            {errors.firstName && <span className="text-xs text-red-500">{errors.firstName.message}</span>}
          </div>
          
          <div className="space-y-1.5">
            <label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Last name</label>
            <input
              id="lastName"
              {...register("lastName", { required: "Last name is required" })}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white dark:bg-gray-800 dark:text-white ${errors.lastName ? 'border-red-300 dark:border-red-800' : 'border-gray-200 dark:border-gray-700'}`}
              placeholder="Doe"
            />
            {errors.lastName && <span className="text-xs text-red-500">{errors.lastName.message}</span>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
          <input
            id="email"
            type="email"
            {...register("email", { 
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address"
              }
            })}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white dark:bg-gray-800 dark:text-white ${errors.email ? 'border-red-300 dark:border-red-800' : 'border-gray-200 dark:border-gray-700'}`}
            placeholder="jane@example.com"
          />
          {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone number</label>
          <input
            id="phone"
            {...register("phone", { required: "Phone is required" })}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white dark:bg-gray-800 dark:text-white ${errors.phone ? 'border-red-300 dark:border-red-800' : 'border-gray-200 dark:border-gray-700'}`}
            placeholder="+1 (555) 000-0000"
          />
          {errors.phone && <span className="text-xs text-red-500">{errors.phone.message}</span>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">Tag / Role</label>
          <select
            id="role"
            {...register("role")}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white dark:bg-gray-800 dark:text-white"
          >
            <option value="Lead">Lead</option>
            <option value="Customer">Customer</option>
            <option value="Partner">Partner</option>
            <option value="Overseas">Overseas</option>
            <option value="VIP">VIP</option>
          </select>
        </div>

        <div className="pt-4 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none disabled:opacity-70 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Customer')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
