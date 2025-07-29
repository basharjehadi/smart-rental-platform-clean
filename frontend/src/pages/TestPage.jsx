import React from 'react';

const TestPage = () => {
  console.log('TestPage is rendering');
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Test Page
        </h1>
        <p className="text-gray-600">
          This is a test page to check if routing is working.
        </p>
        <div className="mt-4 p-4 bg-blue-100 rounded">
          <p className="text-blue-800">
            If you can see this, the routing is working correctly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestPage; 