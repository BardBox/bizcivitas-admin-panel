import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api/api";

interface CoreMember {
  _id: string;
  fname: string;
  lname: string;
}

interface CGCPositionModalProps {
  groupId: string;
  groupName: string;
  coreMembers: CoreMember[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CGC_POSITIONS = [
  { value: "president", label: "President" },
  { value: "networkingDirector", label: "Networking Director" },
  { value: "membershipDirector", label: "Membership Director" },
];

interface LeaderAssignment {
  memberId: string;
  position: string;
}

const CGCPositionModal: React.FC<CGCPositionModalProps> = ({
  groupId,
  groupName,
  coreMembers,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [assignments, setAssignments] = useState<LeaderAssignment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch existing CGC positions when modal opens
  useEffect(() => {
    if (isOpen && groupId) {
      fetchCGCPositions();
    }
  }, [isOpen, groupId]);

  const fetchCGCPositions = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/coregroups/${groupId}/cgc-positions`);
      const existingPositions = response.data.data || {};

      // Convert existing positions to assignments array
      const loadedAssignments: LeaderAssignment[] = [];

      if (existingPositions.president) {
        loadedAssignments.push({
          memberId: existingPositions.president._id || existingPositions.president,
          position: "president",
        });
      }
      if (existingPositions.networkingDirector) {
        loadedAssignments.push({
          memberId: existingPositions.networkingDirector._id || existingPositions.networkingDirector,
          position: "networkingDirector",
        });
      }
      if (existingPositions.membershipDirector) {
        loadedAssignments.push({
          memberId: existingPositions.membershipDirector._id || existingPositions.membershipDirector,
          position: "membershipDirector",
        });
      }

      setAssignments(loadedAssignments.length > 0 ? loadedAssignments : [{ memberId: "", position: "" }]);
    } catch (error) {
      console.error("Error fetching CGC positions:", error);
      setAssignments([{ memberId: "", position: "" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAssignment = () => {
    setAssignments([...assignments, { memberId: "", position: "" }]);
  };

  const handleRemoveAssignment = (index: number) => {
    const newAssignments = assignments.filter((_, i) => i !== index);
    setAssignments(newAssignments.length > 0 ? newAssignments : [{ memberId: "", position: "" }]);
  };

  const handleMemberChange = (index: number, memberId: string) => {
    const newAssignments = [...assignments];
    newAssignments[index].memberId = memberId;
    setAssignments(newAssignments);
  };

  const handlePositionChange = (index: number, position: string) => {
    const newAssignments = [...assignments];
    newAssignments[index].position = position;
    setAssignments(newAssignments);
  };

  const handleSave = async () => {
    // Filter out empty assignments
    const validAssignments = assignments.filter(
      (a) => a.memberId !== "" && a.position !== ""
    );

    // Validation: Check for duplicate members
    const memberIds = validAssignments.map((a) => a.memberId);
    const uniqueMemberIds = new Set(memberIds);
    if (memberIds.length !== uniqueMemberIds.size) {
      toast.error("Same member cannot be assigned to multiple positions");
      return;
    }

    // Validation: Check for duplicate positions
    const positions = validAssignments.map((a) => a.position);
    const uniquePositions = new Set(positions);
    if (positions.length !== uniquePositions.size) {
      toast.error("Each position can only be assigned once");
      return;
    }

    // Convert assignments to the format expected by the API
    const cgcPositions: any = {
      president: "",
      networkingDirector: "",
      membershipDirector: "",
    };

    validAssignments.forEach((assignment) => {
      cgcPositions[assignment.position] = assignment.memberId;
    });

    setIsSaving(true);
    try {
      await api.post(`/coregroups/${groupId}/assign-cgc-positions`, {
        cgcPositions,
      });

      toast.success("CGC positions assigned successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error assigning CGC positions:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to assign CGC positions";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const getAvailablePositions = (currentIndex: number) => {
    const usedPositions = assignments
      .map((a, i) => (i !== currentIndex ? a.position : null))
      .filter((p) => p !== null && p !== "");
    return CGC_POSITIONS.filter((p) => !usedPositions.includes(p.value));
  };

  const getAvailableMembers = (currentIndex: number) => {
    const usedMemberIds = assignments
      .map((a, i) => (i !== currentIndex ? a.memberId : null))
      .filter((m) => m !== null && m !== "");
    return coreMembers.filter((m) => !usedMemberIds.includes(m._id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Assign CGC Positions</h2>
              <p className="text-blue-100 text-sm mt-1">{groupName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Instructions:</strong> Select a core member and assign them a CGC position.
                  You can assign up to 3 positions (President, Networking Director, Membership Director).
                </p>
              </div>

              {/* Dynamic Leader Assignments */}
              <div className="space-y-4">
                {assignments.map((assignment, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-all relative"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Core Member Dropdown */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Select Core Member *
                        </label>
                        <select
                          value={assignment.memberId}
                          onChange={(e) => handleMemberChange(index, e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          <option value="">-- Select Member --</option>
                          {getAvailableMembers(index).map((member) => (
                            <option key={member._id} value={member._id}>
                              {member.fname} {member.lname}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Position Dropdown - Only shows when member is selected */}
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          Select Position *
                        </label>
                        <select
                          value={assignment.position}
                          onChange={(e) => handlePositionChange(index, e.target.value)}
                          disabled={!assignment.memberId}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {assignment.memberId
                              ? "-- Select Position --"
                              : "Select member first"}
                          </option>
                          {getAvailablePositions(index).map((position) => (
                            <option key={position.value} value={position.value}>
                              {position.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Remove Button */}
                    {assignments.length > 1 && (
                      <button
                        onClick={() => handleRemoveAssignment(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                        title="Remove this assignment"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add More Button */}
              {assignments.length < 3 && (
                <button
                  onClick={handleAddAssignment}
                  className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-all font-semibold flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Another Leader
                </button>
              )}

              {/* Current Assignments Summary */}
              {assignments.some((a) => a.memberId && a.position) && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-bold text-green-800 mb-3">
                    Current Assignments:
                  </h3>
                  <div className="space-y-2">
                    {assignments
                      .filter((a) => a.memberId && a.position)
                      .map((assignment, index) => {
                        const member = coreMembers.find(
                          (m) => m._id === assignment.memberId
                        );
                        const position = CGC_POSITIONS.find(
                          (p) => p.value === assignment.position
                        );
                        return (
                          <div
                            key={index}
                            className="flex justify-between items-center text-sm bg-white p-2 rounded"
                          >
                            <span className="font-medium text-gray-700">
                              {member ? `${member.fname} ${member.lname}` : ""}
                            </span>
                            <span className="text-green-700 font-semibold">
                              {position?.label}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              "Save CGC Positions"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CGCPositionModal;
