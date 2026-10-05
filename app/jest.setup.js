/* eslint-env jest */
const mockStorageData = {};
const mockStorage = {
  setItem: jest.fn((key, value) => {
    mockStorageData[key] = String(value);
    return Promise.resolve(null);
  }),
  getItem: jest.fn((key) => {
    return Promise.resolve(mockStorageData[key] ?? null);
  }),
  removeItem: jest.fn((key) => {
    delete mockStorageData[key];
    return Promise.resolve(null);
  }),
  clear: jest.fn(() => {
    Object.keys(mockStorageData).forEach((k) => delete mockStorageData[k]);
    return Promise.resolve(null);
  }),
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  ...mockStorage,
  default: mockStorage,
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockPicker = (props) => React.createElement(View, props);
  return {
    __esModule: true,
    default: MockPicker,
    DateTimePickerAndroid: {
      open: jest.fn(),
      dismiss: jest.fn(),
    },
  };
});
