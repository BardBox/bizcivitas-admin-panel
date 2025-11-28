# React Hook Form Integration Guide

> **Purpose**: Guide to integrate the new UserFormModal component using React Hook Form
> **Created**: November 28, 2025

---

## 📦 What's Been Created

### New Component: `UserFormModal.tsx`

**Location**: `src/components/UserFormModal.tsx`

**Features**:
- ✅ React Hook Form for form state management
- ✅ Yup schema validation
- ✅ Real-time validation on blur
- ✅ Conditional validation (Region vs City/State/Country)
- ✅ Duplicate error handling (email, mobile, username)
- ✅ Loading states during submission
- ✅ TypeScript typed props and form data
- ✅ Clean separation of concerns

---

## 🔧 Integration Steps

### Step 1: Import the Component

Add this import at the top of `src/pages/user/user.tsx`:

```typescript
import UserFormModal from "../../components/UserFormModal";
```

### Step 2: Uncomment the "Add User" Button

Find line 769-774 in `user.tsx` and uncomment the button:

```typescript
<button
  onClick={openAddModal}
  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
>
  Add User
</button>
```

### Step 3: Uncomment the `openAddModal` Function

Find line 555-576 and uncomment this function (simplified version):

```typescript
const openAddModal = () => {
  setModalType("add");
  setShowModal(true);
  setSelectedUser(null);
};
```

### Step 4: Replace the Old Modal with New Component

Find the modal code starting at line 784 and **replace the entire modal block** with:

```typescript
{/* User Form Modal - Using React Hook Form */}
<UserFormModal
  show={showModal}
  modalType={modalType}
  onClose={() => setShowModal(false)}
  onSuccess={fetchData}
  coreMembers={coreMembers}
  regions={regions}
  selectedUser={selectedUser}
/>
```

### Step 5: Remove Unused State and Functions (Optional Cleanup)

You can now remove these from `user.tsx` as they're no longer needed:

```typescript
// Can be removed:
const [formData, setFormData] = useState({...}); // Line 96-111
const [errors, setErrors] = useState<{ [key: string]: string }>({}); // Line 114
const [touchedFields, setTouchedFields] = useState<{...}>({}); // Line 115-117

// Can be removed:
const validateRealTime = () => {...}; // Line 256-339
const handleFieldBlur = (fieldName: string) => {...}; // Line 341-344
const handleAddUser = async (e: React.FormEvent) => {...}; // Line 346-426
const handleUpdateUser = async (e: React.FormEvent) => {...}; // Line 428-490
const handleDuplicateKeyErrors = (error: any) => {...}; // Line 230-254
```

**⚠️ Important**: Only remove these after confirming the new modal works correctly!

---

## 📝 Complete Example Integration

Here's the minimal changes needed in `user.tsx`:

### At the top (imports):
```typescript
import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useVisibility } from "../../context/VisibilityContext";
import { CSVLink } from "react-csv";
import UserFormModal from "../../components/UserFormModal"; // ✅ Add this
```

### In the component (add this function):
```typescript
const openAddModal = () => {
  setModalType("add");
  setShowModal(true);
  setSelectedUser(null);
};
```

### In the render (replace old modal):
```typescript
{/* Replace the entire modal div (line 784-1170) with this: */}
<UserFormModal
  show={showModal}
  modalType={modalType}
  onClose={() => setShowModal(false)}
  onSuccess={fetchData}
  coreMembers={coreMembers}
  regions={regions}
  selectedUser={selectedUser}
/>
```

### In the filters section (uncomment button):
```typescript
<button
  onClick={openAddModal}
  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
>
  Add User
</button>
```

---

## 🎯 How It Works

### Form Validation Flow

```
User types → onChange → React Hook Form updates state
User blurs field → onBlur → Yup validation runs
User submits → onSubmit → Full validation → API call
API error (duplicate) → setError() → Error displays under field
```

### Conditional Validation

The form automatically switches between two validation modes:

**Mode 1: Non-Digital Memberships** (Core, Flagship, Industria)
- **Required**: Region
- **Optional**: City, State, Country
- Shows "Region" dropdown
- Shows "Referred By" dropdown

**Mode 2: Digital Memberships** (Digital, Digital Trial)
- **Required**: City, State, Country
- **Optional**: Region
- Shows City/State/Country text inputs
- Hides "Referred By"

This is controlled by watching the `membershipType` field:

```typescript
const membershipType = watch("membershipType");
const isDigitalMembership =
  membershipType === "Digital Membership" ||
  membershipType === "Digital Membership Trial";
```

---

## 🧪 Testing the Form

### Test Checklist

#### Basic Validation
- [ ] Submit empty form → See all required field errors
- [ ] Enter invalid email → See email format error
- [ ] Enter 9-digit mobile → See mobile validation error
- [ ] Enter first name with numbers → See alphabet-only error
- [ ] Enter username with spaces → See alphanumeric error

#### Membership Type Switching
- [ ] Select "Core Membership" → Region field appears
- [ ] Select "Digital Membership" → City/State/Country appear
- [ ] Switch between types → Fields update correctly
- [ ] Submit with wrong fields → See conditional validation errors

#### API Integration
- [ ] Create user with valid data → Success toast appears
- [ ] Create user with duplicate email → Error shows under email field
- [ ] Create user with duplicate mobile → Error shows under mobile field
- [ ] Update existing user → Changes saved correctly

#### Edge Cases
- [ ] Create user without last name → Works (optional)
- [ ] Create user without username → Auto-generated by backend
- [ ] Close modal → Form resets
- [ ] Open for update → Form pre-populated with user data

---

## 🔍 Component Props Reference

```typescript
interface UserFormModalProps {
  show: boolean;              // Controls modal visibility
  modalType: "add" | "update"; // Determines form mode
  onClose: () => void;         // Called when modal closes
  onSuccess: () => void;       // Called after successful submit
  coreMembers: CoreMember[];   // List for "Referred By" dropdown
  regions: Region[];           // List for "Region" dropdown
  selectedUser?: any;          // User data for update mode (optional)
}
```

---

## 🎨 Validation Schema

The Yup schema is dynamically created based on membership type:

```typescript
const createValidationSchema = (membershipType: string) => {
  const isDigitalMembership = /* check membership type */;

  return yup.object().shape({
    fname: yup.string().required().matches(/^[A-Za-z]+$/),
    email: yup.string().required().email(),
    mobile: yup.string().required().matches(/^[0-9]{10}$/),

    // Conditional: Region required for non-Digital
    region: isDigitalMembership
      ? yup.string().optional()
      : yup.string().required(),

    // Conditional: City/State/Country required for Digital
    city: isDigitalMembership
      ? yup.string().required()
      : yup.string().optional(),

    // ... more fields
  });
};
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module '../../components/UserFormModal'"

**Solution**: Make sure the file path is correct. It should be:
```
bizcivitas-admin-panel/
  src/
    components/
      UserFormModal.tsx  ← Create this file
    pages/
      user/
        user.tsx  ← Import from here
```

### Form doesn't validate on blur

**Solution**: Check that you're using `mode: "onBlur"` in `useForm()`:
```typescript
const { control, ... } = useForm({
  mode: "onBlur", // ← Make sure this is set
  resolver: yupResolver(schema),
});
```

### Conditional fields not showing

**Solution**: Make sure you're watching the `membershipType` field:
```typescript
const membershipType = watch("membershipType");
```

And using it for conditional rendering:
```typescript
{!isDigitalMembership ? (
  // Show Region
) : (
  // Show City/State/Country
)}
```

### Duplicate errors not showing under fields

**Solution**: Use `setError()` in the catch block:
```typescript
catch (error) {
  if (duplicateFields.includes("email")) {
    setError("email", {
      type: "manual",
      message: "Email already exists",
    });
  }
}
```

---

## 📊 Benefits of React Hook Form

### Before (Old Form)
- ❌ Manual state management for each field
- ❌ Complex validation logic spread across functions
- ❌ Touched fields tracking manually
- ❌ Errors state managed separately
- ❌ Repeated onChange handlers
- ❌ ~500 lines of form code

### After (New Form)
- ✅ Automatic form state management
- ✅ Centralized validation with Yup schema
- ✅ Built-in dirty/touched tracking
- ✅ Integrated error management
- ✅ Single Controller per field
- ✅ ~300 lines of cleaner code

### Performance Improvements
- **Re-renders**: Only re-renders changed fields (not entire form)
- **Validation**: Runs only on blur/submit (not on every keystroke)
- **Bundle size**: React Hook Form is lightweight (~8KB gzipped)

---

## 🚀 Next Steps

1. **Test the integration**
   - Try creating users with different roles
   - Test validation errors
   - Verify API responses

2. **Add more features** (optional)
   - Add form field tooltips
   - Add password field for manual entry
   - Add file upload for avatar
   - Add confirmation dialog before submit

3. **Refactor other forms**
   - Apply same pattern to Event creation
   - Apply to Meeting creation
   - Apply to Blog creation

---

## 📚 Resources

- [React Hook Form Docs](https://react-hook-form.com/)
- [Yup Validation Schema](https://github.com/jquense/yup)
- [Controller API](https://react-hook-form.com/docs/usecontroller/controller)
- [Form Validation Guide](https://react-hook-form.com/get-started#Applyvalidation)

---

**Need Help?**
- Check browser console for errors
- Review the UserFormModal.tsx file
- Test with simple valid data first
- Verify backend endpoints are working

---

**Document Version**: 1.0
**Last Updated**: November 28, 2025
