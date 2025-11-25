import React, { useEffect, useState } from 'react';
import { Typography, Box, Paper, Button, TextField, IconButton } from '@mui/material';
import { FiPlus, FiTrash2, FiEdit } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import api from '../../api/api';

const membershipTypes = [
  'Core Membership',
  'Flagship Membership',
  'Industria Membership',
  'Digital Membership',
];

const sampleBenefits: { [key: string]: string[] } = {
  'Core Membership': [
    'Access to exclusive networking events',
    'Monthly business webinars',
    'Member-only discounts on services',
  ],
  'Flagship Membership': [
    'Priority access to premium events',
    'One-on-one mentorship sessions',
    'Featured listing in member directory',
    'Access to advanced analytics dashboard',
  ],
  'Industria Membership': [
    'Industry-specific workshops',
    'Access to research reports',
    'Dedicated account manager',
  ],
  'Digital Membership': [
    'Online community access',
    'Digital content library',
    'Virtual event participation',
  ],
};

interface MembershipBenefit {
  _id: string;
  membershipType: string;
  content: string[];
  isActive: boolean;
}

const MembershipBenefitsAdmin: React.FC = () => {
  const [benefits, setBenefits] = useState<MembershipBenefit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [benefitToDelete, setBenefitToDelete] = useState<MembershipBenefit | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [selectedMembershipType, setSelectedMembershipType] = useState<{ value: string; label: string } | null>(null);
  const [contentList, setContentList] = useState<string[]>([]);
  const [newContent, setNewContent] = useState<string>('');
  const [editingBenefit, setEditingBenefit] = useState<MembershipBenefit | null>(null);
  const [editingContentIndex, setEditingContentIndex] = useState<number | null>(null);
  const [editContentValue, setEditContentValue] = useState<string>('');

  const membershipTypeOptions = membershipTypes.map(type => ({
    value: type,
    label: type,
  }));

  // Fetch all membership benefits
  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        setLoading(true);
        const response = await api.get('/memberships/admin/benefits');
        const fetchedBenefits = response.data.data;
        if (fetchedBenefits.length === 0) {
          // If no benefits, initialize with sample data
          const sampleData = Object.entries(sampleBenefits).map(([membershipType, content], index) => ({
            _id: `sample-${index}`,
            membershipType,
            content,
            isActive: true,
          }));
          setBenefits(sampleData);
        } else {
          setBenefits(fetchedBenefits);
        }
      } catch (err) {
        setError('Failed to load membership benefits.');
        toast.error('Failed to load membership benefits', { position: 'top-center' });
      } finally {
        setLoading(false);
      }
    };
    fetchBenefits();
  }, []);

  // Open modal for adding or editing a benefit
  const openModal = (benefit?: MembershipBenefit) => {
    if (benefit) {
      setEditingBenefit(benefit);
      setSelectedMembershipType({ value: benefit.membershipType, label: benefit.membershipType });
      setContentList(benefit.content);
    } else {
      setEditingBenefit(null);
      setSelectedMembershipType(null);
      setContentList([]);
    }
    setNewContent('');
    setEditingContentIndex(null);
    setEditContentValue('');
    setIsModalOpen(true);
  };

  // Add new content to the list
  const handleAddContent = () => {
    if (!newContent.trim()) {
      toast.error('Content cannot be empty', { position: 'top-center' });
      return;
    }
    setContentList([...contentList, newContent.trim()]);
    setNewContent('');
  };

  // Delete a content item from the list
  const handleDeleteContent = (index: number) => {
    if (contentList.length <= 1) {
      toast.error('At least one content item is required', { position: 'top-center' });
      return;
    }
    const updatedContent = contentList.filter((_, i) => i !== index);
    setContentList(updatedContent);
  };

  // Start editing a content item
  const startEditContent = (index: number, content: string) => {
    setEditingContentIndex(index);
    setEditContentValue(content);
  };

  // Save edited content
  const saveEditContent = (index: number) => {
    if (!editContentValue.trim()) {
      toast.error('Content cannot be empty', { position: 'top-center' });
      return;
    }
    const updatedContent = [...contentList];
    updatedContent[index] = editContentValue.trim();
    setContentList(updatedContent);
    setEditingContentIndex(null);
    setEditContentValue('');
  };

  // Handle form submission for adding or updating a benefit
  const handleSubmit = async () => {
    if (!selectedMembershipType || contentList.length === 0) {
      toast.error('Please select a membership type and add at least one content item', { position: 'top-center' });
      return;
    }

    try {
      const payload = {
        membershipType: selectedMembershipType.value,
        content: contentList,
      };

      if (editingBenefit && !editingBenefit._id.startsWith('sample-')) {
        await api.put(`/memberships/admin/benefits/${editingBenefit._id}`, payload);
        toast.success('Benefit updated successfully!', { position: 'top-center' });
      } else {
        await api.post('/membership-benefits/admin/benefits', payload);
        toast.success('Benefit added successfully!', { position: 'top-center' });
      }

      setIsModalOpen(false);
      const response = await api.get('/memberships/admin/benefits');
      setBenefits(response.data.data);
    } catch (err) {
      toast.error(`Error ${editingBenefit ? 'updating' : 'saving'} benefit`, { position: 'top-center' });
    }
  };

  // Open delete confirmation
  const confirmDelete = (benefit: MembershipBenefit) => {
    setBenefitToDelete(benefit);
    setShowDeleteConfirm(true);
  };

  // Handle delete action
  const handleDelete = async () => {
    if (!benefitToDelete) return;

    // Skip deletion for sample data
    if (benefitToDelete._id.startsWith('sample-')) {
      setShowDeleteConfirm(false);
      setBenefitToDelete(null);
      toast.info('Cannot delete sample data', { position: 'top-center' });
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(`/membership-benefits/admin/benefits/${benefitToDelete._id}`);
      toast.success('Benefit deleted successfully!', { position: 'top-center' });
      setShowDeleteConfirm(false);
      setBenefitToDelete(null);
      const response = await api.get('/memberships/admin/benefits');
      setBenefits(response.data.data);
    } catch (err) {
      toast.error('Error deleting benefit', { position: 'top-center' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box sx={{ p: 6,  maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'end', alignItems: 'center', mb: 4 }}>
       
        <Button
          variant="contained"
          color="primary"
          startIcon={<FiPlus />}
          onClick={() => openModal()}
          sx={{ px: 4, py: 1.5, fontSize: '15px' }}
        >
          Add Benefit
        </Button>
      </Box>

      {/* Loading & Error Handling */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Typography variant="h6">Loading...</Typography>
        </Box>
      )}
      {error && !loading && (
        <Typography variant="h6" color="error" align="center">
          {error}
        </Typography>
      )}

      {/* Benefits List */}
      {!loading && benefits.length > 0 && (
        <Box sx={{ mt: 3 }}>
          {benefits.map((benefit) => (
            <Paper key={benefit._id} sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" color="primary" fontWeight="medium">
                  {benefit.membershipType}
                </Typography>
                <Box>
                  <IconButton onClick={() => openModal(benefit)} color="primary" sx={{ mr: 1 }}>
                    <FiEdit size={20} />
                  </IconButton>
                  <IconButton onClick={() => confirmDelete(benefit)} color="error">
                    <FiTrash2 size={20} />
                  </IconButton>
                </Box>
              </Box>
              <ul style={{ paddingLeft: '25px', margin: 0 }}>
                {benefit.content.map((item, index) => (
                  <li key={index}>
                    <Typography variant="body1" sx={{ mb: 1 }}>{item}</Typography>
                  </li>
                ))}
              </ul>
            </Paper>
          ))}
        </Box>
      )}

      {/* No Benefits Found */}
      {!loading && benefits.length === 0 && (
        <Typography variant="h6" align="center" color="text.secondary">
          No membership benefits found.
        </Typography>
      )}

      {/* Modal for Adding/Editing Benefit */}
      {isModalOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
            zIndex: 1000,
          }}
        >
          <Box sx={{ bgcolor: 'white', p: 4, borderRadius: 2, maxWidth: '600px', width: '100%' }}>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              {editingBenefit ? 'Edit Benefit' : 'Add New Benefit'}
            </Typography>
            <Select
              value={selectedMembershipType}
              onChange={(option) => setSelectedMembershipType(option)}
              options={membershipTypeOptions}
              placeholder="Select Membership Type"
              className="mb-4"
              isDisabled={!!editingBenefit}
            />
            <Box sx={{ mb: 3, maxHeight: '200px', overflowY: 'auto' }}>
              {contentList.map((content, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  {editingContentIndex === index ? (
                    <>
                      <TextField
                        value={editContentValue}
                        onChange={(e) => setEditContentValue(e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ mr: 1 }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => saveEditContent(index)}
                        sx={{ minWidth: '80px' }}
                      >
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Typography sx={{ flexGrow: 1, pr: 2 }}>{content}</Typography>
                      <IconButton onClick={() => startEditContent(index, content)} size="small" sx={{ mr: 1 }}>
                        <FiEdit />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteContent(index)} size="small" color="error">
                        <FiTrash2 />
                      </IconButton>
                    </>
                  )}
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TextField
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter content"
                size="small"
                fullWidth
                sx={{ mr: 1 }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleAddContent}
                startIcon={<FiPlus />}
                sx={{ minWidth: '120px' }}
              >
                Add Content
              </Button>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setIsModalOpen(false)}
                sx={{ px: 4, py: 1.5 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                sx={{ px: 4, py: 1.5 }}
              >
                {editingBenefit ? 'Update' : 'Save'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && benefitToDelete && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
            zIndex: 1000,
          }}
        >
          <Box sx={{ bgcolor: 'white', p: 4, borderRadius: 2, maxWidth: '400px', width: '100%' }}>
            <Typography variant="h6" fontWeight="bold" align="center" mb={3}>
              Confirm Delete
            </Typography>
            <Typography align="center" mb={4}>
              Are you sure you want to delete the benefit for <strong>{benefitToDelete.membershipType}</strong>?
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setShowDeleteConfirm(false)}
                sx={{ px: 4, py: 1.5 }}
              >
                No
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleDelete}
                disabled={isDeleting}
                sx={{ px: 4, py: 1.5 }}
              >
                {isDeleting ? 'Deleting...' : 'Yes'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </Box>
  );
};

export default MembershipBenefitsAdmin;