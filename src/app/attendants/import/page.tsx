'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CSVImportResult {
  message: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  results: {
    successful: Array<{ id: string; email: string; name: string }>;
    failed: Array<{ row: any; error: string }>;
    skipped: Array<{ row: any; reason: string }>;
  };
}

export default function CSVImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }

    return data;
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const csvText = await file.text();
      const csvData = parseCSV(csvText);

      if (csvData.length === 0) {
        throw new Error('CSV file is empty or invalid');
      }

      const response = await fetch('/api/attendants/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData }),
      });

      if (!response.ok) {
        throw new Error('Failed to import CSV data');
      }

      const importResult = await response.json();
      setResult(importResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = `firstName,lastName,email,phone,availabilityStatus,notes,experienceLevel
John,Doe,john.doe@example.com,555-0101,AVAILABLE,Sample attendant,BEGINNER
Jane,Smith,jane.smith@example.com,555-0102,AVAILABLE,Another sample,INTERMEDIATE`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendants_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.push('/attendants')}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Attendants
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Import Attendants from CSV</h1>
          <p className="mt-2 text-gray-600">
            Upload a CSV file to bulk import attendant data
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-blue-900 mb-4">CSV Format Requirements</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Required columns:</strong> firstName, lastName, email</p>
            <p><strong>Optional columns:</strong> phone, availabilityStatus, notes, experienceLevel</p>
            <p><strong>Available statuses:</strong> AVAILABLE, UNAVAILABLE</p>
            <p><strong>Experience levels:</strong> BEGINNER, INTERMEDIATE, ADVANCED, EXPERT</p>
          </div>
          <button
            onClick={downloadSampleCSV}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Download Sample CSV
          </button>
        </div>

        {/* Upload Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload CSV File</h3>
          
          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {file && (
              <div className="text-sm text-gray-600">
                Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-800">{error}</div>
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'Importing...' : 'Import Attendants'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Import Results</h3>
            
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{result.summary.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-900">{result.summary.successful}</div>
                <div className="text-sm text-green-600">Successful</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-900">{result.summary.skipped}</div>
                <div className="text-sm text-yellow-600">Skipped</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-900">{result.summary.failed}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>

            {/* Successful Imports */}
            {result.results.successful.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-green-900 mb-2">
                  Successfully Imported ({result.results.successful.length})
                </h4>
                <div className="bg-green-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  {result.results.successful.map((attendant, index) => (
                    <div key={index} className="text-sm text-green-800">
                      ✓ {attendant.name} ({attendant.email})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skipped */}
            {result.results.skipped.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-yellow-900 mb-2">
                  Skipped ({result.results.skipped.length})
                </h4>
                <div className="bg-yellow-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  {result.results.skipped.map((item, index) => (
                    <div key={index} className="text-sm text-yellow-800">
                      ⚠ {item.row.firstName} {item.row.lastName} - {item.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Failed */}
            {result.results.failed.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-red-900 mb-2">
                  Failed ({result.results.failed.length})
                </h4>
                <div className="bg-red-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  {result.results.failed.map((item, index) => (
                    <div key={index} className="text-sm text-red-800">
                      ✗ {item.row.firstName || 'Unknown'} {item.row.lastName || ''} - {item.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/attendants')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                View All Attendants
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setError(null);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Import Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
