import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

interface InviteBy {
  key: string;
  name: string;
  _id: string;
}

interface Guest {
  _id: string;
  fname: string;
  lname: string;
  email: string;
  mobile: string;
  inviteBy: InviteBy;
  attendence: boolean;
  tableNo?: string;
}

const GuestList: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [editingTableNo, setEditingTableNo] = useState<string | null>(null);
  const [newTableNo, setNewTableNo] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [guestToDelete, setGuestToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/guests/`
        );
        setGuests(response.data.data);
      } catch (error) {
        console.error("Error fetching guests:", error);
        setError("Failed to fetch guest data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGuests();
  }, []);

  const handleAddOrEditTableNo = async (guestId: string) => {
    if (!newTableNo.trim()) {
      setError("Table number cannot be empty.");
      return;
    }

    try {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/guests/guest/addTableNo`,
        {
          guestId,
          tableNo: newTableNo,
        }
      );

      setGuests((prevGuests) =>
        prevGuests.map((guest) =>
          guest._id === guestId ? { ...guest, tableNo: newTableNo } : guest
        )
      );

      setEditingTableNo(null);
      setNewTableNo("");
    } catch (error: any) {
      console.error(
        "Error updating table number:",
        error.response?.data || error.message
      );
      setError("Failed to update table number. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (guestToDelete) {
      try {
        const deleteUrl = `${
          import.meta.env.VITE_API_BASE_URL
        }/guests/deleteOneGuest?id=${guestToDelete}`;
        await axios.delete(deleteUrl);

        setGuests((prevGuests) =>
          prevGuests.filter((guest) => guest._id !== guestToDelete)
        );
        setShowDeleteModal(false);
      } catch (error: any) {
        console.error(
          "Error deleting guest:",
          error.response?.data || error.message
        );
        setError(
          error.response?.data?.message ||
            "Failed to delete the guest. Please try again."
        );
      }
    }
  };

  const handleExport = () => {
    const data = guests.map((guest) => ({
      "First Name": guest.fname,
      "Last Name": guest.lname,
      Email: guest.email,
      "Mobile No": guest.mobile,
      "Invited By": guest.inviteBy?.name || "N/A",
      Attendance: guest.attendence ? "Present" : "-",
      "Table No": guest.tableNo || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Guests");

    XLSX.writeFile(workbook, "guest_list.xlsx");
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="text-xl md:text-2xl font-bold">
          Guests at Bizcivitas Launch Event
        </h1>
        <button
          onClick={handleExport}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Export to Excel
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300 text-sm md:text-base">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-2 min-w-[120px]">First Name</th>
                <th className="border px-2 py-2 min-w-[120px]">Last Name</th>
                <th className="border px-2 py-2 min-w-[180px]">Email</th>
                <th className="border px-2 py-2 min-w-[150px]">Mobile No</th>
                <th className="border px-2 py-2 min-w-[150px]">Invited By</th>
                <th className="border px-2 py-2 min-w-[100px]">Attendance</th>
                <th className="border px-2 py-2 min-w-[100px]">Table No</th>
                <th className="border px-2 py-2 min-w-[120px]">Actions</th>
                <th className="border px-2 py-2 min-w-[120px]">Delete</th>
              </tr>
            </thead>
            <tbody>
              {guests.length > 0 ? (
                guests.map((guest) => (
                  <tr key={guest._id} className="even:bg-gray-50 odd:bg-white">
                    <td className="border px-2 py-2">{guest.fname}</td>
                    <td className="border px-2 py-2">{guest.lname}</td>
                    <td className="border px-2 py-2">{guest.email}</td>
                    <td className="border px-2 py-2">{guest.mobile}</td>
                    <td className="border px-2 py-2">
                      {guest.inviteBy ? guest.inviteBy.name : "N/A"}
                    </td>
                    <td className="border px-4 py-2">
                      {guest.attendence ? "Present" : "-"}
                    </td>

                    <td className="border px-2 py-2">
                      {guest.tableNo || "N/A"}
                    </td>
                    <td className="border px-2 py-2">
                      {editingTableNo === guest._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newTableNo}
                            onChange={(e) => setNewTableNo(e.target.value)}
                            className="border px-2 py-1 rounded"
                            placeholder="Enter table no"
                          />
                          <button
                            onClick={() => handleAddOrEditTableNo(guest._id)}
                            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingTableNo(null);
                              setNewTableNo("");
                            }}
                            className="bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingTableNo(guest._id);
                            setNewTableNo(guest.tableNo || "");
                          }}
                          className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 text-sm"
                        >
                          {guest.tableNo ? "Edit Table No" : "Add Table No"}
                        </button>
                      )}
                    </td>
                    <td className="border px-2 py-2">
                      <button
                        onClick={() => {
                          setGuestToDelete(guest._id);
                          setShowDeleteModal(true);
                        }}
                        className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-4">
                    No guests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">
              Are you sure you want to delete this guest?
            </h3>
            <div className="flex justify-between">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestList;
