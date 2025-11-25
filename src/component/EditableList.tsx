import React, { useState } from "react";
import { Box, IconButton, TextField, Typography } from "@mui/material";
import { List, arrayMove } from "react-movable";
import AddIcon from "@mui/icons-material/Add";
import DoneIcon from "@mui/icons-material/Done";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface EditableListProps {
  values: string[];
  onChange: (newValues: string[]) => void;
  label: string;
  error?: string;
}

const EditableList: React.FC<EditableListProps> = ({
  values,
  onChange,
  label,
  error,
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const addItem = () => {
    onChange([...values, inputValue]);
    setInputValue("");
  };

  const editItem = (index: number) => {
    setIsEditing(index);
    setEditValue(values[index]);
  };

  const saveEdit = (index: number) => {
    const updatedValues = [...values];
    updatedValues[index] = editValue;
    onChange(updatedValues);
    setIsEditing(null);
    setEditValue("");
  };

  const deleteItem = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mt={1}>
        <TextField
          value={inputValue}
          onChange={handleInputChange}
          label={`Add ${label}`}
          multiline
          rows={2}
          fullWidth
        />
        <IconButton
          onClick={addItem}
          disabled={!inputValue.trim()}
          color="primary"
        >
          <AddIcon />
        </IconButton>
      </Box>
      <List
        values={values}
        onChange={({ oldIndex, newIndex }) =>
          onChange(arrayMove(values, oldIndex, newIndex))
        }
        renderList={({ children, props }) => (
          <Box {...props} mt={2}>
            {children}
          </Box>
        )}
        renderItem={({ value, props, index }) => (
          <Box
            {...props}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
            p={1}
            border={1}
            borderRadius={1}
            key={index}
          >
            {isEditing === index ? (
              <TextField
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                multiline
                rows={2}
                fullWidth
              />
            ) : (
              <Typography>{value}</Typography>
            )}
            <Box display="flex" ml={1}>
              {isEditing === index ? (
                <IconButton
                  onClick={() => index !== undefined && saveEdit(index)}
                  color="primary"
                >
                  <DoneIcon />
                </IconButton>
              ) : (
                <IconButton
                  onClick={() => index !== undefined && editItem(index)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
              )}
              <IconButton
                onClick={() => index !== undefined && deleteItem(index)}
                style={{ color: "red" }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        )}
      />
      {error && <Typography color="error">{error}</Typography>}{" "}
    </Box>
  );
};

export default EditableList;
