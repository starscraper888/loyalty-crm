'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { validateImport, processImport } from './actions'

export default function ImportPage() {
    const [step, setStep] = useState(1)
    const [file, setFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<any[]>([])
    const [headers, setHeaders] = useState<string[]>([])
    const [checksum, setChecksum] = useState('')

    // Mapping: DB Field -> CSV Header
    const [columnMap, setColumnMap] = useState<Record<string, string>>({
        phone: '',
        name: '',
        points: ''
    })

    const [validationStats, setValidationStats] = useState<any>(null)
    const [importStats, setImportStats] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // Step 1: Upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        setFile(f)

        // Calculate Checksum
        const buffer = await f.arrayBuffer()
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        setChecksum(hashHex)

        // Parse CSV
        Papa.parse(f, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setParsedData(results.data)
                setHeaders(results.meta.fields || [])
                // Auto-map if headers match
                const map = { ...columnMap }
                results.meta.fields?.forEach(h => {
                    const lower = h.toLowerCase()
                    if (lower.includes('phone') || lower.includes('mobile')) map.phone = h
                    if (lower.includes('name')) map.name = h
                    if (lower.includes('point')) map.points = h
                })
                setColumnMap(map)
            }
        })
    }

    // Step 3: Dry Run
    const handleDryRun = async () => {
        setLoading(true)
        try {
            const stats = await validateImport(parsedData, columnMap)
            setValidationStats(stats)
            setStep(3)
        } catch (err) {
            console.error(err)
            alert('Validation failed')
        } finally {
            setLoading(false)
        }
    }

    // Step 4: Import
    const handleImport = async () => {
        setLoading(true)
        try {
            const stats = await processImport(parsedData, columnMap)
            setImportStats(stats)
            setStep(4)
        } catch (err) {
            console.error(err)
            alert('Import failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Bulk Import Members</h1>

                {/* Stepper */}
                <div className="flex items-center justify-between mb-8">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`flex items-center ${s < 4 ? 'flex-1' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700'
                                }`}>
                                {s}
                            </div>
                            {s < 4 && <div className={`h-1 flex-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                        </div>
                    ))}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">

                    {/* Step 1: Upload */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold dark:text-white">1. Upload CSV</h2>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <p className="mt-2 text-sm text-gray-500">Max 10MB. CSV format.</p>
                            </div>
                            {file && (
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <p className="text-sm font-medium dark:text-white">File: {file.name}</p>
                                    <p className="text-xs text-gray-500">Size: {(file.size / 1024).toFixed(2)} KB</p>
                                    <p className="text-xs text-gray-500 break-all">SHA-256: {checksum}</p>
                                    <p className="text-xs text-gray-500 mt-2">{parsedData.length} rows parsed</p>
                                </div>
                            )}
                            <div className="flex justify-end">
                                <button
                                    disabled={!file}
                                    onClick={() => setStep(2)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                                >
                                    Next: Map Columns
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Map */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold dark:text-white">2. Map Columns</h2>
                            <div className="space-y-4">
                                {['phone', 'name', 'points'].map(field => (
                                    <div key={field} className="grid grid-cols-3 gap-4 items-center">
                                        <label className="text-sm font-medium capitalize dark:text-gray-300">{field} {field === 'phone' && '*'}</label>
                                        <div className="col-span-2">
                                            <select
                                                value={columnMap[field]}
                                                onChange={e => setColumnMap({ ...columnMap, [field]: e.target.value })}
                                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            >
                                                <option value="">-- Select Header --</option>
                                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between">
                                <button onClick={() => setStep(1)} className="text-gray-600 dark:text-gray-400">Back</button>
                                <button
                                    disabled={!columnMap.phone}
                                    onClick={handleDryRun}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                                >
                                    {loading ? 'Validating...' : 'Next: Dry Run'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Dry Run */}
                    {step === 3 && validationStats && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold dark:text-white">3. Validation Results</h2>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-green-600">{validationStats.valid}</p>
                                    <p className="text-sm text-green-800 dark:text-green-200">Valid Rows</p>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-yellow-600">{validationStats.duplicates}</p>
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">Duplicates</p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-red-600">{validationStats.invalid}</p>
                                    <p className="text-sm text-red-800 dark:text-red-200">Invalid</p>
                                </div>
                            </div>

                            {validationStats.errors.length > 0 && (
                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                                    <h3 className="text-sm font-bold text-red-800 dark:text-red-200 mb-2">Sample Errors</h3>
                                    <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                                        {validationStats.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <button onClick={() => setStep(2)} className="text-gray-600 dark:text-gray-400">Back</button>
                                <button
                                    onClick={handleImport}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg"
                                >
                                    {loading ? 'Importing...' : 'Start Import'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Results */}
                    {step === 4 && importStats && (
                        <div className="space-y-6 text-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold dark:text-white">Import Complete</h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                Successfully imported {importStats.success} members.
                                {importStats.errors > 0 && ` Failed to import ${importStats.errors} rows.`}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                            >
                                Import Another File
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
