
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { toast } from 'react-toastify';
// import { MdEdit, MdDelete, MdAdd, MdClose } from 'react-icons/md';

// interface RiskConfig {
//   id: number;
//   maxLoss: number;
//   maxProfit: number;
//   isActive: boolean;
//   createdAt?: string;
//   updatedAt?: string;
// }

// interface FormData {
//   maxLoss: string;
//   maxProfit: string;
//   isActive: boolean;
// }

// const initialFormData: FormData = {
//   maxLoss: '',
//   maxProfit: '',
//   isActive: true
// };

// export default function RiskConfigPage() {
//   const apiUrl = import.meta.env.VITE_API_URL;
  
//   // States
//   const [riskConfigs, setRiskConfigs] = useState<RiskConfig[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
//   const [selectedId, setSelectedId] = useState<number | null>(null);
//   const [formData, setFormData] = useState<FormData>(initialFormData);
//   const [deleteModalOpen, setDeleteModalOpen] = useState(false);
//   const [configToDelete, setConfigToDelete] = useState<RiskConfig | null>(null);
//   const [submitting, setSubmitting] = useState(false);

//   // Form validation errors
//   const [errors, setErrors] = useState<Partial<FormData>>({});

//   // ============== API Functions ==============

//   // Fetch all risk configs
//   const fetchRiskConfigs = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get(`${apiUrl}/admin/riskconfig`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('token')}`
//         }
//       });

//       if (response.data.status) {
//         setRiskConfigs(response.data.data);
//       } else {
//         toast.error(response.data.message || 'Failed to fetch data');
//       }
//     } catch (error: any) {
//       toast.error(error.message || 'Something went wrong');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Create risk config
//   const createRiskConfig = async (data: FormData) => {
//     setSubmitting(true);
//     try {
//       const response = await axios.post(
//         `${apiUrl}/admin/riskconfig`,
//         {
//           maxLoss: parseFloat(data.maxLoss),
//           maxProfit: parseFloat(data.maxProfit),
//           isActive: data.isActive
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem('token')}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       if (response.data.status) {
//         toast.success('Risk configuration created successfully');
//         await fetchRiskConfigs();
//         closeModal();
//       } else {
//         toast.error(response.data.message || 'Failed to create');
//       }
//     } catch (error: any) {
//       toast.error(error.message || 'Something went wrong');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Update risk config
//   const updateRiskConfig = async (id: number, data: FormData) => {
//     setSubmitting(true);
//     try {
//       const response = await axios.put(
//         `${apiUrl}/admin/riskconfig/${id}`,
//         {
//           maxLoss: parseFloat(data.maxLoss),
//           maxProfit: parseFloat(data.maxProfit),
//           isActive: data.isActive
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem('token')}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       if (response.data.status) {
//         toast.success('Risk configuration updated successfully');
//         await fetchRiskConfigs();
//         closeModal();
//       } else {
//         toast.error(response.data.message || 'Failed to update');
//       }
//     } catch (error: any) {
//       toast.error(error.message || 'Something went wrong');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Delete risk config
//   const deleteRiskConfig = async (id: number) => {
//     setSubmitting(true);
//     try {
//       const response = await axios.delete(`${apiUrl}/admin/riskconfig/${id}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('token')}`
//         }
//       });

//       if (response.data.status) {
//         toast.success('Risk configuration deleted successfully');
//         await fetchRiskConfigs();
//         setDeleteModalOpen(false);
//         setConfigToDelete(null);
//       } else {
//         toast.error(response.data.message || 'Failed to delete');
//       }
//     } catch (error: any) {
//       toast.error(error.message || 'Something went wrong');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Fetch single config for update
//   const fetchSingleConfig = async (id: number) => {
//     try {
//       const response = await axios.get(`${apiUrl}/admin/riskconfig/${id}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('token')}`
//         }
//       });

//       if (response.data.status) {
//         const config = response.data.data;
//         setFormData({
//           maxLoss: config.maxLoss.toString(),
//           maxProfit: config.maxProfit.toString(),
//           isActive: config.isActive
//         });
//       }
//     } catch (error: any) {
//       toast.error(error.message || 'Failed to fetch config details');
//     }
//   };

//   // ============== Helper Functions ==============

//   const validateForm = (): boolean => {
//     const newErrors: Partial<FormData> = {};

//     if (!formData.maxLoss) {
//       newErrors.maxLoss = 'Max Loss is required';
//     } else if (isNaN(parseFloat(formData.maxLoss)) || parseFloat(formData.maxLoss) <= 0) {
//       newErrors.maxLoss = 'Max Loss must be a positive number';
//     }

//     if (!formData.maxProfit) {
//       newErrors.maxProfit = 'Max Profit is required';
//     } else if (isNaN(parseFloat(formData.maxProfit)) || parseFloat(formData.maxProfit) <= 0) {
//       newErrors.maxProfit = 'Max Profit must be a positive number';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//     // Clear error for this field
//     if (errors[name as keyof FormData]) {
//       setErrors(prev => ({ ...prev, [name]: undefined }));
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       return;
//     }

//     if (modalMode === 'create') {
//       await createRiskConfig(formData);
//     } else if (modalMode === 'update' && selectedId) {
//       await updateRiskConfig(selectedId, formData);
//     }
//   };

//   const openCreateModal = () => {
//     setModalMode('create');
//     setFormData(initialFormData);
//     setErrors({});
//     setSelectedId(null);
//     setModalOpen(true);
//   };

//   const openUpdateModal = async (config: RiskConfig) => {
//     setModalMode('update');
//     setSelectedId(config.id);
//     await fetchSingleConfig(config.id);
//     setErrors({});
//     setModalOpen(true);
//   };

//   const openDeleteModal = (config: RiskConfig) => {
//     setConfigToDelete(config);
//     setDeleteModalOpen(true);
//   };

//   const closeModal = () => {
//     setModalOpen(false);
//     setFormData(initialFormData);
//     setErrors({});
//     setSelectedId(null);
//   };

//   const confirmDelete = () => {
//     if (configToDelete) {
//       deleteRiskConfig(configToDelete.id);
//     }
//   };

//   // Format currency
//   const formatCurrency = (value: number) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     }).format(value);
//   };

//   // Format date
//   const formatDate = (dateString?: string) => {
//     if (!dateString) return '-';
//     return new Date(dateString).toLocaleString('en-IN', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   useEffect(() => {
//     fetchRiskConfigs();
//   }, []);

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold text-gray-800">Risk Configuration Management</h1>
//         <button
//           onClick={openCreateModal}
//           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
//         >
//           <MdAdd className="text-xl" />
//           <span>Add New Configuration</span>
//         </button>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-lg shadow-sm overflow-hidden">
//         {loading ? (
//           <div className="p-8 text-center text-gray-500">Loading risk configurations...</div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     ID
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Max Loss
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Max Profit
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Created At
//                   </th>
//                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {riskConfigs.length === 0 ? (
//                   <tr>
//                     <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
//                       No risk configurations found
//                     </td>
//                   </tr>
//                 ) : (
//                   riskConfigs.map((config) => (
//                     <tr key={config.id} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         #{config.id}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
//                         {formatCurrency(config.maxLoss)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
//                         {formatCurrency(config.maxProfit)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                           config.isActive 
//                             ? 'bg-green-100 text-green-800' 
//                             : 'bg-red-100 text-red-800'
//                         }`}>
//                           {config.isActive ? 'Active' : 'Inactive'}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {formatDate(config.createdAt)}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                         <button
//                           onClick={() => openUpdateModal(config)}
//                           className="text-blue-600 hover:text-blue-900 mr-3"
//                           title="Edit"
//                         >
//                           <MdEdit className="text-xl" />
//                         </button>
//                         <button
//                           onClick={() => openDeleteModal(config)}
//                           className="text-red-600 hover:text-red-900"
//                           title="Delete"
//                         >
//                           <MdDelete className="text-xl" />
//                         </button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Create/Update Modal */}
//       {modalOpen && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
//             <div className="bg-blue-600 text-white rounded-t-lg p-4">
//               <div className="flex justify-between items-center">
//                 <h3 className="text-lg font-semibold">
//                   {modalMode === 'create' ? 'Add New Risk Configuration' : 'Update Risk Configuration'}
//                 </h3>
//                 <button onClick={closeModal} className="text-white hover:text-gray-200">
//                   <MdClose className="text-2xl" />
//                 </button>
//               </div>
//             </div>

//             <form onSubmit={handleSubmit} className="p-5">
//               {/* Max Loss Input */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Max Loss (₹)
//                 </label>
//                 <input
//                   type="number"
//                   name="maxLoss"
//                   value={formData.maxLoss}
//                   onChange={handleInputChange}
//                   step="0.01"
//                   min="0.01"
//                   className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                     errors.maxLoss ? 'border-red-500' : 'border-gray-300'
//                   }`}
//                   placeholder="Enter max loss amount"
//                 />
//                 {errors.maxLoss && (
//                   <p className="mt-1 text-sm text-red-600">{errors.maxLoss}</p>
//                 )}
//               </div>

//               {/* Max Profit Input */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Max Profit (₹)
//                 </label>
//                 <input
//                   type="number"
//                   name="maxProfit"
//                   value={formData.maxProfit}
//                   onChange={handleInputChange}
//                   step="0.01"
//                   min="0.01"
//                   className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                     errors.maxProfit ? 'border-red-500' : 'border-gray-300'
//                   }`}
//                   placeholder="Enter max profit amount"
//                 />
//                 {errors.maxProfit && (
//                   <p className="mt-1 text-sm text-red-600">{errors.maxProfit}</p>
//                 )}
//               </div>

//               {/* Active Status */}
//               <div className="mb-6">
//                 <label className="flex items-center gap-2 cursor-pointer">
//                   <input
//                     type="checkbox"
//                     name="isActive"
//                     checked={formData.isActive}
//                     onChange={handleInputChange}
//                     className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                   />
//                   <span className="text-sm font-medium text-gray-700">Active</span>
//                 </label>
//                 <p className="mt-1 text-xs text-gray-500">
//                   Inactive configurations will not be applied
//                 </p>
//               </div>

//               {/* Buttons */}
//               <div className="flex justify-end gap-3">
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={submitting}
//                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
//                 >
//                   {submitting 
//                     ? 'Processing...' 
//                     : modalMode === 'create' ? 'Create' : 'Update'
//                   }
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Delete Confirmation Modal */}
//       {deleteModalOpen && configToDelete && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
//             <div className="bg-red-600 text-white rounded-t-lg p-4">
//               <h3 className="text-lg font-semibold">Confirm Delete</h3>
//             </div>

//             <div className="p-5">
//               <p className="text-gray-700 mb-4">
//                 Are you sure you want to delete this risk configuration?
//               </p>
              
//               <div className="bg-gray-50 p-3 rounded-lg mb-4">
//                 <p className="text-sm text-gray-600">
//                   <span className="font-medium">Max Loss:</span> {formatCurrency(configToDelete.maxLoss)}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   <span className="font-medium">Max Profit:</span> {formatCurrency(configToDelete.maxProfit)}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   <span className="font-medium">Status:</span>{' '}
//                   <span className={configToDelete.isActive ? 'text-green-600' : 'text-red-600'}>
//                     {configToDelete.isActive ? 'Active' : 'Inactive'}
//                   </span>
//                 </p>
//               </div>

//               <p className="text-sm text-red-600 mb-4">
//                 This action cannot be undone.
//               </p>

//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={() => {
//                     setDeleteModalOpen(false);
//                     setConfigToDelete(null);
//                   }}
//                   className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={confirmDelete}
//                   disabled={submitting}
//                   className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
//                 >
//                   {submitting ? 'Deleting...' : 'Delete'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MdEdit, MdDelete, MdAdd, MdClose } from 'react-icons/md';

interface RiskConfig {
  id: number;
  maxLoss: number | null;
  maxProfit: number | null;
  strategyOne: {
    fund: number;
    maxLoss: number;
  } | null;
  strategyTwo: {
    fund: number;
    maxLoss: number;
  } | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  maxLoss: string;
  maxProfit: string;
  strategyOneFund: string;
  strategyOneLoss: string;
  strategyTwoFund: string;
  strategyTwoLoss: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  maxLoss: '',
  maxProfit: '',
  strategyOneFund: '',
  strategyOneLoss: '',
  strategyTwoFund: '',
  strategyTwoLoss: '',
  isActive: false
};

export default function RiskConfigPage() {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // States
  const [riskConfigs, setRiskConfigs] = useState<RiskConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<RiskConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form validation errors
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // ============== API Functions ==============

  // Fetch all risk configs
  const fetchRiskConfigs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/admin/riskconfig`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.status) {
        setRiskConfigs(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch data');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Create risk config
  const createRiskConfig = async (data: FormData) => {
    setSubmitting(true);
    try {
      const payload: any = {
        isActive: data.isActive
      };

      // Only add fields that have values
      if (data.maxLoss) {
        payload.maxLoss = parseFloat(data.maxLoss);
      }

      if (data.maxProfit) {
        payload.maxProfit = parseFloat(data.maxProfit);
      }

      if (data.strategyOneFund && data.strategyOneLoss) {
        payload.strategyOne = {
          fund: parseFloat(data.strategyOneFund),
          maxLoss: parseFloat(data.strategyOneLoss)
        };
      }

      if (data.strategyTwoFund && data.strategyTwoLoss) {
        payload.strategyTwo = {
          fund: parseFloat(data.strategyTwoFund),
          maxLoss: parseFloat(data.strategyTwoLoss)
        };
      }

      const response = await axios.post(
        `${apiUrl}/admin/riskconfig`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status) {
        toast.success('Risk configuration created successfully');
        await fetchRiskConfigs();
        closeModal();
      } else {
        toast.error(response.data.message || 'Failed to create');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // Update risk config
  const updateRiskConfig = async (id: number, data: FormData) => {
    setSubmitting(true);
    try {
      const payload: any = {
        isActive: data.isActive
      };

      // Only add fields that have values
      if (data.maxLoss) {
        payload.maxLoss = parseFloat(data.maxLoss);
      }

      if (data.maxProfit) {
        payload.maxProfit = parseFloat(data.maxProfit);
      }

      if (data.strategyOneFund && data.strategyOneLoss) {
        payload.strategyOne = {
          fund: parseFloat(data.strategyOneFund),
          maxLoss: parseFloat(data.strategyOneLoss)
        };
      } else {
        // If fields are empty, set to null to remove
        payload.strategyOne = null;
      }

      if (data.strategyTwoFund && data.strategyTwoLoss) {
        payload.strategyTwo = {
          fund: parseFloat(data.strategyTwoFund),
          maxLoss: parseFloat(data.strategyTwoLoss)
        };
      } else {
        payload.strategyTwo = null;
      }

      const response = await axios.put(
        `${apiUrl}/admin/riskconfig/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status) {
        toast.success('Risk configuration updated successfully');
        await fetchRiskConfigs();
        closeModal();
      } else {
        toast.error(response.data.message || 'Failed to update');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete risk config
  const deleteRiskConfig = async (id: number) => {
    setSubmitting(true);
    try {
      const response = await axios.delete(`${apiUrl}/admin/riskconfig/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.status) {
        toast.success('Risk configuration deleted successfully');
        await fetchRiskConfigs();
        setDeleteModalOpen(false);
        setConfigToDelete(null);
      } else {
        toast.error(response.data.message || 'Failed to delete');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch single config for update
  const fetchSingleConfig = async (id: number) => {
    try {
      const response = await axios.get(`${apiUrl}/admin/riskconfig/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.status) {
        const config = response.data.data;
        setFormData({
          maxLoss: config.maxLoss?.toString() || '',
          maxProfit: config.maxProfit?.toString() || '',
          strategyOneFund: config.strategyOne?.fund?.toString() || '',
          strategyOneLoss: config.strategyOne?.maxLoss?.toString() || '',
          strategyTwoFund: config.strategyTwo?.fund?.toString() || '',
          strategyTwoLoss: config.strategyTwo?.maxLoss?.toString() || '',
          isActive: config.isActive
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch config details');
    }
  };

  // ============== Helper Functions ==============

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    // Validate maxLoss if provided
    if (formData.maxLoss && (isNaN(parseFloat(formData.maxLoss)) || parseFloat(formData.maxLoss) <= 0)) {
      newErrors.maxLoss = 'Max Loss must be a positive number';
    }

    // Validate maxProfit if provided
    if (formData.maxProfit && (isNaN(parseFloat(formData.maxProfit)) || parseFloat(formData.maxProfit) <= 0)) {
      newErrors.maxProfit = 'Max Profit must be a positive number';
    }

    // Validate Strategy One if any field is filled
    if (formData.strategyOneFund || formData.strategyOneLoss) {
      if (!formData.strategyOneFund) {
        newErrors.strategyOneFund = 'Fund amount is required for Strategy One';
      } else if (isNaN(parseFloat(formData.strategyOneFund)) || parseFloat(formData.strategyOneFund) <= 0) {
        newErrors.strategyOneFund = 'Fund must be a positive number';
      }

      if (!formData.strategyOneLoss) {
        newErrors.strategyOneLoss = 'Max Loss is required for Strategy One';
      } else if (isNaN(parseFloat(formData.strategyOneLoss)) || parseFloat(formData.strategyOneLoss) <= 0) {
        newErrors.strategyOneLoss = 'Max Loss must be a positive number';
      }
    }

    // Validate Strategy Two if any field is filled
    if (formData.strategyTwoFund || formData.strategyTwoLoss) {
      if (!formData.strategyTwoFund) {
        newErrors.strategyTwoFund = 'Fund amount is required for Strategy Two';
      } else if (isNaN(parseFloat(formData.strategyTwoFund)) || parseFloat(formData.strategyTwoFund) <= 0) {
        newErrors.strategyTwoFund = 'Fund must be a positive number';
      }

      if (!formData.strategyTwoLoss) {
        newErrors.strategyTwoLoss = 'Max Loss is required for Strategy Two';
      } else if (isNaN(parseFloat(formData.strategyTwoLoss)) || parseFloat(formData.strategyTwoLoss) <= 0) {
        newErrors.strategyTwoLoss = 'Max Loss must be a positive number';
      }
    }

    // At least one configuration must be provided
    if (!formData.maxLoss && !formData.maxProfit && 
        !formData.strategyOneFund && !formData.strategyOneLoss &&
        !formData.strategyTwoFund && !formData.strategyTwoLoss) {
      toast.error('At least one configuration (Max Loss/Profit or Strategy) must be provided');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (modalMode === 'create') {
      await createRiskConfig(formData);
    } else if (modalMode === 'update' && selectedId) {
      await updateRiskConfig(selectedId, formData);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormData);
    setErrors({});
    setSelectedId(null);
    setModalOpen(true);
  };

  const openUpdateModal = async (config: RiskConfig) => {
    setModalMode('update');
    setSelectedId(config.id);
    await fetchSingleConfig(config.id);
    setErrors({});
    setModalOpen(true);
  };

  const openDeleteModal = (config: RiskConfig) => {
    setConfigToDelete(config);
    setDeleteModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormData(initialFormData);
    setErrors({});
    setSelectedId(null);
  };

  const confirmDelete = () => {
    if (configToDelete) {
      deleteRiskConfig(configToDelete.id);
    }
  };

  // Format currency
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format JSON object display
  const formatStrategy = (strategy: any) => {
    if (!strategy) return '-';
    return `Fund: ${formatCurrency(strategy.fund)} | Loss: ${formatCurrency(strategy.maxLoss)}`;
  };

  useEffect(() => {
    fetchRiskConfigs();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Risk Configuration Management</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <MdAdd className="text-xl" />
          <span>Add New Configuration</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading risk configurations...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Loss
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Strategy One
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Strategy Two
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {riskConfigs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No risk configurations found
                    </td>
                  </tr>
                ) : (
                  riskConfigs.map((config) => (
                    <tr key={config.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{config.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {config.maxLoss ? formatCurrency(config.maxLoss) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {config.maxProfit ? formatCurrency(config.maxProfit) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatStrategy(config.strategyOne)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatStrategy(config.strategyTwo)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          config.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {config.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(config.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openUpdateModal(config)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Edit"
                        >
                          <MdEdit className="text-xl" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(config)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <MdDelete className="text-xl" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Update Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white rounded-t-lg p-4 sticky top-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {modalMode === 'create' ? 'Add New Risk Configuration' : 'Update Risk Configuration'}
                </h3>
                <button onClick={closeModal} className="text-white hover:text-gray-200">
                  <MdClose className="text-2xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              {/* Global Settings Section */}
              <div className="mb-6 border-b pb-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Global Settings</h4>
                
                {/* Max Loss Input */}
                {/* <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Loss (₹) - Optional
                  </label>
                  <input
                    type="number"
                    name="maxLoss"
                    value={formData.maxLoss}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0.01"
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.maxLoss ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter max loss amount"
                  />
                  {errors.maxLoss && (
                    <p className="mt-1 text-sm text-red-600">{errors.maxLoss}</p>
                  )}
                </div> */}

                {/* Max Profit Input */}
                {/* <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Profit (₹) - Optional
                  </label>
                  <input
                    type="number"
                    name="maxProfit"
                    value={formData.maxProfit}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0.01"
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.maxProfit ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter max profit amount"
                  />
                  {errors.maxProfit && (
                    <p className="mt-1 text-sm text-red-600">{errors.maxProfit}</p>
                  )}
                </div> */}
              </div>

              {/* Strategy One Section */}
              <div className="mb-6 border-b pb-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Strategy One Configuration</h4>
                <p className="text-xs text-gray-500 mb-3">Default: Fund ₹50,000 | Max Loss ₹15,000</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fund Amount (₹)
                    </label>
                    <input
                      type="number"
                      name="strategyOneFund"
                      value={formData.strategyOneFund}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0.01"
                      className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.strategyOneFund ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter fund amount"
                    />
                    {errors.strategyOneFund && (
                      <p className="mt-1 text-sm text-red-600">{errors.strategyOneFund}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Loss (₹)
                    </label>
                    <input
                      type="number"
                      name="strategyOneLoss"
                      value={formData.strategyOneLoss}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0.01"
                      className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.strategyOneLoss ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter max loss"
                    />
                    {errors.strategyOneLoss && (
                      <p className="mt-1 text-sm text-red-600">{errors.strategyOneLoss}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Strategy Two Section */}
              <div className="mb-6 border-b pb-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Strategy Two Configuration</h4>
                <p className="text-xs text-gray-500 mb-3">Default: Fund ₹100,000 | Max Loss ₹30,000</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fund Amount (₹)
                    </label>
                    <input
                      type="number"
                      name="strategyTwoFund"
                      value={formData.strategyTwoFund}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0.01"
                      className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.strategyTwoFund ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter fund amount"
                    />
                    {errors.strategyTwoFund && (
                      <p className="mt-1 text-sm text-red-600">{errors.strategyTwoFund}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Loss (₹)
                    </label>
                    <input
                      type="number"
                      name="strategyTwoLoss"
                      value={formData.strategyTwoLoss}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0.01"
                      className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.strategyTwoLoss ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter max loss"
                    />
                    {errors.strategyTwoLoss && (
                      <p className="mt-1 text-sm text-red-600">{errors.strategyTwoLoss}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Status */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Inactive configurations will not be applied
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submitting 
                    ? 'Processing...' 
                    : modalMode === 'create' ? 'Create' : 'Update'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && configToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="bg-red-600 text-white rounded-t-lg p-4">
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
            </div>

            <div className="p-5">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this risk configuration?
              </p>
              
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                {configToDelete.maxLoss && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Max Loss:</span> {formatCurrency(configToDelete.maxLoss)}
                  </p>
                )}
                {configToDelete.maxProfit && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Max Profit:</span> {formatCurrency(configToDelete.maxProfit)}
                  </p>
                )}
                {configToDelete.strategyOne && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Strategy One:</span> {formatStrategy(configToDelete.strategyOne)}
                  </p>
                )}
                {configToDelete.strategyTwo && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Strategy Two:</span> {formatStrategy(configToDelete.strategyTwo)}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Status:</span>{' '}
                  <span className={configToDelete.isActive ? 'text-green-600' : 'text-red-600'}>
                    {configToDelete.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>

              <p className="text-sm text-red-600 mb-4">
                This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setConfigToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}