import { useState, useEffect, useRef } from 'react'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
}

interface UserSearchSelectProps {
  onSelect: (user: User) => void
  onClose: () => void
  placeholder?: string
}

export default function UserSearchSelect({ onSelect, onClose, placeholder = "Search users..." }: UserSearchSelectProps) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch all users on mount
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const result = await response.json()
          const userList = result.data || []
          setUsers(userList)
          setFilteredUsers(userList)
        } else {
          console.error('Failed to fetch users:', response.status)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    // Filter users based on search
    if (search.trim() === '') {
      setFilteredUsers(users)
    } else {
      const searchLower = search.toLowerCase()
      setFilteredUsers(
        users.filter(user => 
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        )
      )
    }
  }, [search, users])

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div ref={dropdownRef} className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
      <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>
      
      {loading ? (
        <div className="p-4 text-center text-gray-500">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No users found</div>
      ) : (
        <div className="py-1">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                onSelect(user)
                onClose()
              }}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
            >
              <div className="font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-sm text-gray-600">{user.email}</div>
              {user.phone && <div className="text-xs text-gray-500">{user.phone}</div>}
              <div className="text-xs text-gray-400 mt-1">{user.role}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
