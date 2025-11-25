import React from 'react';
import Select from 'react-select';

interface Option {
  value: string;
  label: string;
}

interface CategorySelectProps {
  options: Option[];
  value: Option | null;
  onChange: (option: Option | null) => void;
  placeholder: string;
  className?: string;
}

const CategorySelect: React.FC<CategorySelectProps> = ({ options, value, onChange, placeholder, className }) => {
  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      styles={{
        control: provided => ({
          ...provided,
          height: '40px',
          minHeight: '40px',
          borderRadius: '0.5rem',
          borderColor: '#D1D5DB',
          '&:hover': {
            borderColor: '#3B82F6',
          },
        }),
        valueContainer: provided => ({
          ...provided,
          padding: '0 12px',
        }),
      }}
    />
  );
};

export default CategorySelect;