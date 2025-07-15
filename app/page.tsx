"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

const BASE_URL = "http://localhost:5000"

export default function PointsManagementApp() {
  const [currentView, setCurrentView] = useState("main-menu")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string>("")
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Form states
  const [signupForm, setSignupForm] = useState({
    fname: "",
    lname: "",
    pw1: "",
    pw2: "",
  })

  const [signinForm, setSigninForm] = useState({
    fname: "",
    lname: "",
    password: "",
  })

  const [addAmount, setAddAmount] = useState("")
  const [subtractAmount, setSubtractAmount] = useState("")

  // Info states
  const [addPointsInfo, setAddPointsInfo] = useState("")
  const [subtractPointsInfo, setSubtractPointsInfo] = useState("")

  // Message states
  const [signupMessage, setSignupMessage] = useState("")
  const [signinMessage, setSigninMessage] = useState("")
  const [addPointsMessage, setAddPointsMessage] = useState("")
  const [subtractPointsMessage, setSubtractPointsMessage] = useState("")

  useEffect(() => {
    // Check for existing session
    const userId = sessionStorage.getItem("userId")
    const fname = sessionStorage.getItem("fname")
    if (userId && fname) {
      setCurrentUserId(userId)
      setCurrentUserName(fname)
      setCurrentView("points-menu")
    }
  }, [])

  const clearMessages = () => {
    setSignupMessage("")
    setSigninMessage("")
    setAddPointsMessage("")
    setSubtractPointsMessage("")
  }

  const navigateToView = (newView: string) => {
    if (isTransitioning) return

    setIsTransitioning(true)
    clearMessages()

    setTimeout(() => {
      setCurrentView(newView)
      setIsTransitioning(false)
    }, 300)
  }

  const showMain = () => navigateToView("main-menu")
  const showSignup = () => navigateToView("signup-form")
  const showSignin = () => navigateToView("signin-form")
  const showPointsMenu = () => navigateToView("points-menu")
  const showAddPoints = () => {
    navigateToView("add-points-form")
    setTimeout(fetchAddPointsInfo, 300)
  }
  const showSubtractPoints = () => {
    navigateToView("subtract-points-form")
    setTimeout(fetchSubtractPointsInfo, 300)
  }

  const exit = () => {
    alert("Exiting application.")
  }

  const confirmSignup = async () => {
    const { fname, lname, pw1, pw2 } = signupForm

    if (!fname || !lname || !pw1 || !pw2) {
      setSignupMessage("Please fill all fields.")
      return
    }

    const snameRes = await fetch(`${BASE_URL}/sname`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fname, lname }),
    }).then((res) => res.json())

    if (snameRes.exists) {
      setSignupMessage("Name already exists. Try signing in.")
      return
    }

    if (pw1 !== pw2) {
      setSignupMessage("Passwords do not match.")
      return
    }

    const idRes = await fetch(`${BASE_URL}/id`).then((res) => res.json())
    const signupRes = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: idRes.id, fname, lname, password: pw1 }),
    }).then((res) => res.json())

    if (signupRes.success) {
      alert("Signup successful!")
      setSignupForm({ fname: "", lname: "", pw1: "", pw2: "" })
      showMain()
    } else {
      setSignupMessage("Signup failed.")
    }
  }

  const signin = async () => {
    const { fname, lname, password } = signinForm

    if (!fname || !lname || !password) {
      setSigninMessage("Please fill all fields.")
      return
    }

    const res = await fetch(`${BASE_URL}/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fname, lname, password }),
    }).then((res) => res.json())

    if (res.success) {
      sessionStorage.setItem("userId", res.id)
      sessionStorage.setItem("fname", res.fname)
      setCurrentUserId(res.id)
      setCurrentUserName(res.fname)
      navigateToView("points-menu")
    } else {
      setSigninMessage("Incorrect name or password.")
    }
  }

  const fetchAddPointsInfo = async () => {
    const totalRes = await fetch(`${BASE_URL}/points/total`).then((res) => res.json())
    const balanceRes = await fetch(`${BASE_URL}/points/${currentUserId}`).then((res) => res.json())
    setAddPointsInfo(`Available: ${100000 - totalRes.total} | Your Points: ${balanceRes.points}`)
  }

  const fetchSubtractPointsInfo = async () => {
    const res = await fetch(`${BASE_URL}/points/${currentUserId}`).then((res) => res.json())
    setSubtractPointsInfo(`Your Points: ${res.points}`)
  }

  const addPoints = async () => {
    const amount = Number.parseInt(addAmount)

    if (!amount || amount <= 0) {
      setAddPointsMessage("Invalid amount.")
      return
    }

    const res = await fetch(`${BASE_URL}/points/add/${currentUserId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    }).then((res) => res.json())

    if (res.success) {
      setAddPointsMessage("Transaction has been successful")
      setTimeout(() => {
        setAddAmount("")
        showPointsMenu()
      }, 2000)
    } else {
      setAddPointsMessage(res.message)
    }
  }

  const subtractPoints = async () => {
    const amount = Number.parseInt(subtractAmount)

    if (!amount || amount <= 0) {
      setSubtractPointsMessage("Invalid amount.")
      return
    }

    const res = await fetch(`${BASE_URL}/points/subtract/${currentUserId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    }).then((res) => res.json())

    if (res.success) {
      setSubtractPointsMessage("Transaction has been successful")
      setTimeout(() => {
        setSubtractAmount("")
        showPointsMenu()
      }, 2000)
    } else {
      setSubtractPointsMessage(res.message)
    }
  }

  const checkBalance = async () => {
    const res = await fetch(`${BASE_URL}/points/${currentUserId}`).then((res) => res.json())
    alert(`Your balance is: ${res.points}`)
  }

  const backToMain = () => {
    sessionStorage.clear()
    setCurrentUserId(null)
    setCurrentUserName("")
    showMain()
  }

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Arial', sans-serif;
          background: #f8f9fa;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        body::before {
          content: '';
          position: fixed;
          top: -50px;
          left: -50px;
          width: calc(100% + 100px);
          height: calc(100% + 100px);
          z-index: -1;
          background-image: 
            radial-gradient(circle at 25% 25%, #4A90A4 0%, #4A90A4 25%, transparent 25%),
            radial-gradient(circle at 75% 25%, #FF6B35 0%, #FF6B35 25%, transparent 25%),
            radial-gradient(circle at 25% 75%, #FFB81C 0%, #FFB81C 25%, transparent 25%),
            radial-gradient(circle at 75% 75%, #B8D4C8 0%, #B8D4C8 25%, transparent 25%),
            radial-gradient(circle at 50% 50%, #2C3E50 0%, #2C3E50 20%, transparent 20%),
            radial-gradient(circle at 20% 50%, #F5F3E7 0%, #F5F3E7 30%, transparent 30%),
            radial-gradient(circle at 80% 50%, #4A90A4 0%, #4A90A4 20%, transparent 20%),
            radial-gradient(circle at 50% 20%, #FF6B35 0%, #FF6B35 15%, transparent 15%),
            radial-gradient(circle at 50% 80%, #B8D4C8 0%, #B8D4C8 25%, transparent 25%);
          background-size: 60px 60px, 80px 80px, 70px 70px, 90px 90px, 50px 50px, 100px 100px, 65px 65px, 55px 55px, 75px 75px;
          background-position: 
            0 0, 30px 30px, 15px 45px, 45px 15px, 25px 25px, 
            10px 10px, 40px 40px, 20px 5px, 35px 50px;
          opacity: 0.08;
          animation: backgroundFloat 25s ease-in-out infinite, backgroundShift 40s linear infinite;
        }

        body::after {
          content: '';
          position: fixed;
          top: -100px;
          left: -100px;
          width: calc(100% + 200px);
          height: calc(100% + 200px);
          z-index: -2;
          background-image: 
            radial-gradient(circle at 60% 40%, #4A90A4 0%, #4A90A4 20%, transparent 20%),
            radial-gradient(circle at 20% 80%, #FF6B35 0%, #FF6B35 18%, transparent 18%),
            radial-gradient(circle at 80% 20%, #FFB81C 0%, #FFB81C 22%, transparent 22%),
            radial-gradient(circle at 40% 60%, #B8D4C8 0%, #B8D4C8 25%, transparent 25%),
            radial-gradient(circle at 70% 70%, #2C3E50 0%, #2C3E50 15%, transparent 15%),
            radial-gradient(circle at 30% 30%, #F5F3E7 0%, #F5F3E7 28%, transparent 28%);
          background-size: 90px 90px, 110px 110px, 85px 85px, 120px 120px, 75px 75px, 95px 95px;
          background-position: 
            20px 20px, 60px 60px, 40px 80px, 80px 40px, 50px 10px, 10px 50px;
          opacity: 0.05;
          animation: backgroundFloat2 30s ease-in-out infinite reverse, backgroundShift2 50s linear infinite reverse;
        }

        @keyframes backgroundFloat {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          25% { 
            transform: translateY(-15px) translateX(10px) rotate(1deg);
          }
          50% { 
            transform: translateY(-25px) translateX(-5px) rotate(0deg);
          }
          75% { 
            transform: translateY(-10px) translateX(-15px) rotate(-1deg);
          }
        }

        @keyframes backgroundFloat2 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          33% { 
            transform: translateY(20px) translateX(-10px) rotate(0.5deg);
          }
          66% { 
            transform: translateY(-15px) translateX(15px) rotate(-0.5deg);
          }
        }

        @keyframes backgroundShift {
          0% { 
            background-position: 
              0 0, 30px 30px, 15px 45px, 45px 15px, 25px 25px, 
              10px 10px, 40px 40px, 20px 5px, 35px 50px;
          }
          25% { 
            background-position: 
              10px 5px, 40px 35px, 25px 50px, 55px 20px, 35px 30px, 
              20px 15px, 50px 45px, 30px 10px, 45px 55px;
          }
          50% { 
            background-position: 
              20px 10px, 50px 40px, 35px 55px, 65px 25px, 45px 35px, 
              30px 20px, 60px 50px, 40px 15px, 55px 60px;
          }
          75% { 
            background-position: 
              10px 5px, 40px 35px, 25px 50px, 55px 20px, 35px 30px, 
              20px 15px, 50px 45px, 30px 10px, 45px 55px;
          }
          100% { 
            background-position: 
              0 0, 30px 30px, 15px 45px, 45px 15px, 25px 25px, 
              10px 10px, 40px 40px, 20px 5px, 35px 50px;
          }
        }

        @keyframes backgroundShift2 {
          0% { 
            background-position: 
              20px 20px, 60px 60px, 40px 80px, 80px 40px, 50px 10px, 10px 50px;
          }
          50% { 
            background-position: 
              30px 30px, 70px 70px, 50px 90px, 90px 50px, 60px 20px, 20px 60px;
          }
          100% { 
            background-position: 
              20px 20px, 60px 60px, 40px 80px, 80px 40px, 50px 10px, 10px 50px;
          }
        }

        .page-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          position: relative;
          z-index: 1;
        }

        .page-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          width: 100%;
          text-align: center;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform: ${isTransitioning ? "translateX(100px)" : "translateX(0)"};
          opacity: ${isTransitioning ? 0 : 1};
        }

        .bank-logo {
          width: 60px;
          height: 60px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #4A90A4, #FF6B35);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          color: white;
        }

        .enhanced-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .enhanced-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .enhanced-button:hover::before {
          left: 100%;
        }

        .enhanced-button:hover {
          transform: translateY(-2px);
        }

        .btn-primary-enhanced {
          background: linear-gradient(135deg, #4A90A4, #5BA3B8);
        }

        .btn-primary-enhanced:hover {
          box-shadow: 0 10px 20px rgba(74, 144, 164, 0.3);
        }

        .btn-success-enhanced {
          background: linear-gradient(135deg, #27AE60, #2ECC71);
        }

        .btn-success-enhanced:hover {
          box-shadow: 0 10px 20px rgba(39, 174, 96, 0.3);
        }

        .btn-danger-enhanced {
          background: linear-gradient(135deg, #E74C3C, #FF6B35);
        }

        .btn-danger-enhanced:hover {
          box-shadow: 0 10px 20px rgba(231, 76, 60, 0.3);
        }

        .user-info {
          background: rgba(74, 144, 164, 0.1);
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
          border-left: 4px solid #4A90A4;
        }

        .balance-display {
          background: linear-gradient(135deg, #4A90A4, #5BA3B8);
          color: white;
          padding: 20px;
          border-radius: 15px;
          margin-bottom: 30px;
          text-align: center;
        }

        .balance-amount {
          font-size: 2.5em;
          font-weight: bold;
          margin: 10px 0;
        }

        .enhanced-input {
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid #e0e0e0;
          transition: all 0.3s ease;
        }

        .enhanced-input:focus {
          border-color: #4A90A4;
          box-shadow: 0 0 0 3px rgba(74, 144, 164, 0.1);
        }

        .error-message {
          color: #E74C3C;
          background: rgba(231, 76, 60, 0.1);
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 15px;
          border-left: 4px solid #E74C3C;
        }

        .success-message {
          color: #27AE60;
          background: rgba(39, 174, 96, 0.1);
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 15px;
          border-left: 4px solid #27AE60;
        }
      `}</style>

      <div className="page-container">
        <Card className="page-card">
          <CardContent className="p-10">
            {/* Main Menu */}
            {currentView === "main-menu" && (
              <div className="space-y-4">
                <div className="bank-logo">PM</div>
                <h1 className="text-3xl font-light text-gray-800 mb-6">Welcome to Points Manager</h1>
                <p className="text-gray-600 mb-8">Your trusted points management system</p>

                <Button
                  onClick={showSignup}
                  className="w-full enhanced-button btn-primary-enhanced text-white border-0 py-3 text-lg font-medium mb-4"
                >
                  Sign Up
                </Button>
                <Button
                  onClick={showSignin}
                  className="w-full enhanced-button btn-success-enhanced text-white border-0 py-3 text-lg font-medium mb-4"
                >
                  Sign In
                </Button>
                <Button
                  onClick={exit}
                  className="w-full enhanced-button btn-danger-enhanced text-white border-0 py-3 text-lg font-medium"
                >
                  Exit
                </Button>
              </div>
            )}

            {/* Signup Form */}
            {currentView === "signup-form" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-normal text-gray-800 mb-6">Sign Up</h2>
                {signupMessage && <div className="error-message text-sm">{signupMessage}</div>}

                <Input
                  type="text"
                  placeholder="First Name"
                  value={signupForm.fname}
                  onChange={(e) => setSignupForm({ ...signupForm, fname: e.target.value })}
                  className="enhanced-input py-3"
                />
                <Input
                  type="text"
                  placeholder="Last Name"
                  value={signupForm.lname}
                  onChange={(e) => setSignupForm({ ...signupForm, lname: e.target.value })}
                  className="enhanced-input py-3"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={signupForm.pw1}
                  onChange={(e) => setSignupForm({ ...signupForm, pw1: e.target.value })}
                  className="enhanced-input py-3"
                />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={signupForm.pw2}
                  onChange={(e) => setSignupForm({ ...signupForm, pw2: e.target.value })}
                  className="enhanced-input py-3"
                />

                <div className="flex space-x-2 mt-6">
                  <Button
                    onClick={confirmSignup}
                    className="flex-1 enhanced-button btn-primary-enhanced text-white border-0 py-3"
                  >
                    Confirm
                  </Button>
                  <Button
                    onClick={showMain}
                    className="flex-1 enhanced-button btn-danger-enhanced text-white border-0 py-3"
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}

            {/* Signin Form */}
            {currentView === "signin-form" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-normal text-gray-800 mb-6">Sign In</h2>
                {signinMessage && <div className="error-message text-sm">{signinMessage}</div>}

                <Input
                  type="text"
                  placeholder="First Name"
                  value={signinForm.fname}
                  onChange={(e) => setSigninForm({ ...signinForm, fname: e.target.value })}
                  className="enhanced-input py-3"
                />
                <Input
                  type="text"
                  placeholder="Last Name"
                  value={signinForm.lname}
                  onChange={(e) => setSigninForm({ ...signinForm, lname: e.target.value })}
                  className="enhanced-input py-3"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={signinForm.password}
                  onChange={(e) => setSigninForm({ ...signinForm, password: e.target.value })}
                  className="enhanced-input py-3"
                />

                <div className="flex space-x-2 mt-6">
                  <Button
                    onClick={signin}
                    className="flex-1 enhanced-button btn-success-enhanced text-white border-0 py-3"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={showMain}
                    className="flex-1 enhanced-button btn-danger-enhanced text-white border-0 py-3"
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}

            {/* Points Menu */}
            {currentView === "points-menu" && (
              <div className="space-y-4">
                <div className="user-info">
                  <h2 className="text-xl font-medium text-gray-800">Welcome {currentUserName}!</h2>
                </div>

                <Button
                  onClick={showAddPoints}
                  className="w-full enhanced-button btn-primary-enhanced text-white border-0 py-3 text-lg font-medium mb-4"
                >
                  Add Points
                </Button>
                <Button
                  onClick={showSubtractPoints}
                  className="w-full enhanced-button btn-primary-enhanced text-white border-0 py-3 text-lg font-medium mb-4"
                >
                  Subtract Points
                </Button>
                <Button
                  onClick={checkBalance}
                  className="w-full enhanced-button btn-success-enhanced text-white border-0 py-3 text-lg font-medium mb-4"
                >
                  Check Balance
                </Button>
                <Button
                  onClick={backToMain}
                  className="w-full enhanced-button btn-danger-enhanced text-white border-0 py-3 text-lg font-medium"
                >
                  Back to Main Menu
                </Button>
              </div>
            )}

            {/* Add Points Form */}
            {currentView === "add-points-form" && (
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-800 mb-4">Add Points</h2>
                <div className="user-info text-sm">{addPointsInfo}</div>

                <Input
                  type="number"
                  placeholder="Amount to add"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="enhanced-input py-3"
                />

                <div className="flex space-x-2 mt-6">
                  <Button
                    onClick={addPoints}
                    className="flex-1 enhanced-button btn-primary-enhanced text-white border-0 py-3"
                  >
                    Add
                  </Button>
                  <Button
                    onClick={showPointsMenu}
                    className="flex-1 enhanced-button btn-danger-enhanced text-white border-0 py-3"
                  >
                    Back
                  </Button>
                </div>

                {addPointsMessage && (
                  <div
                    className={`text-sm ${addPointsMessage.includes("successful") ? "success-message" : "error-message"}`}
                  >
                    {addPointsMessage}
                  </div>
                )}
              </div>
            )}

            {/* Subtract Points Form */}
            {currentView === "subtract-points-form" && (
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-800 mb-4">Subtract Points</h2>
                <div className="user-info text-sm">{subtractPointsInfo}</div>

                <Input
                  type="number"
                  placeholder="Amount to subtract"
                  value={subtractAmount}
                  onChange={(e) => setSubtractAmount(e.target.value)}
                  className="enhanced-input py-3"
                />

                <div className="flex space-x-2 mt-6">
                  <Button
                    onClick={subtractPoints}
                    className="flex-1 enhanced-button btn-primary-enhanced text-white border-0 py-3"
                  >
                    Subtract
                  </Button>
                  <Button
                    onClick={showPointsMenu}
                    className="flex-1 enhanced-button btn-danger-enhanced text-white border-0 py-3"
                  >
                    Back
                  </Button>
                </div>

                {subtractPointsMessage && (
                  <div
                    className={`text-sm ${subtractPointsMessage.includes("successful") ? "success-message" : "error-message"}`}
                  >
                    {subtractPointsMessage}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
