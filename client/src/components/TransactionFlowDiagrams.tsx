import React from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";
import { useTranslation } from "react-i18next";

// Face-to-Face Transaction SVG - with i18n support
export const FaceToFaceDiagram: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <svg
      viewBox="0 0 800 645"
      xmlns="http://www.w3.org/2000/svg"
      key={i18n.language}
    >
      {/* Title */}
      <text
        x="400"
        y="30"
        fontSize="20"
        fontWeight="bold"
        textAnchor="middle"
        fill="#1976d2"
      >
        {t("diagram.faceToFace.title", "Face-to-Face Quick Exchange")}
      </text>
      <text
        x="400"
        y="50"
        fontSize="12"
        textAnchor="middle"
        fill="#666"
        fontStyle="italic"
      >
        {t(
          "diagram.faceToFace.subtitle",
          "(Perfect for events, meetups, or quick lending)"
        )}
      </text>

      {/* Owner/Holder (Left - initiates) */}
      <circle cx="120" cy="120" r="45" fill="#4caf50" />
      <text
        x="120"
        y="120"
        fontSize="13"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t("diagram.roles.owner", "Owner/")}
      </text>
      <text
        x="120"
        y="135"
        fontSize="13"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t("diagram.roles.holder", "Holder")}
      </text>
      <text x="120" y="180" fontSize="11" textAnchor="middle" fill="#333">
        {t("diagram.faceToFace.ownerDesc", "Has item to lend")}
      </text>
      <text
        x="120"
        y="195"
        fontSize="10"
        textAnchor="middle"
        fill="#666"
        fontStyle="italic"
      >
        {t("diagram.faceToFace.appUser", "(App User)")}
      </text>

      {/* Borrower (Right - may not be user) */}
      <circle cx="680" cy="120" r="45" fill="#2196f3" />
      <text
        x="680"
        y="125"
        fontSize="13"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t("diagram.roles.borrower", "Borrower")}
      </text>
      <text x="680" y="180" fontSize="11" textAnchor="middle" fill="#333">
        {t("diagram.faceToFace.borrowerDesc", "Wants to borrow")}
      </text>
      <text
        x="680"
        y="195"
        fontSize="10"
        textAnchor="middle"
        fill="#666"
        fontStyle="italic"
      >
        {t("diagram.faceToFace.mayNotBeUser", "(May not be user)")}
      </text>

      {/* Step 1: Holder Creates Transaction */}
      <rect
        x="30"
        y="230"
        width="180"
        height="80"
        fill="#e8f5e9"
        stroke="#4caf50"
        strokeWidth="3"
        rx="8"
      />
      <text
        x="120"
        y="255"
        fontSize="14"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t("diagram.faceToFace.step1Title", "1. Create Transaction")}
      </text>
      <text x="120" y="275" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.faceToFace.step1Line1", "Holder initiates as")}
      </text>
      <text x="120" y="290" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.faceToFace.step1Line2", '"Face-to-Face" exchange')}
      </text>
      <text
        x="120"
        y="305"
        fontSize="10"
        textAnchor="middle"
        fill="#999"
        fontStyle="italic"
      >
        {t("diagram.faceToFace.step1Line3", "(Self-request mode)")}
      </text>

      {/* Arrow down from holder */}
      <path
        d="M 120 165 L 120 230"
        stroke="#4caf50"
        strokeWidth="3"
        fill="none"
        markerEnd="url(#arrowGreen)"
      />

      {/* Step 2: Share QR/Link */}
      <rect
        x="240"
        y="230"
        width="320"
        height="120"
        fill="#fff3e0"
        stroke="#ff9800"
        strokeWidth="3"
        rx="8"
      />
      <text
        x="400"
        y="255"
        fontSize="15"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t("diagram.faceToFace.step2Title", "2. Share Transaction")}
      </text>

      {/* QR Code Icon */}
      <rect
        x="280"
        y="270"
        width="60"
        height="60"
        fill="white"
        stroke="#333"
        strokeWidth="2"
      />
      <rect x="285" y="275" width="10" height="10" fill="#333" />
      <rect x="325" y="275" width="10" height="10" fill="#333" />
      <rect x="285" y="315" width="10" height="10" fill="#333" />
      <rect x="325" y="315" width="10" height="10" fill="#333" />
      <rect x="295" y="285" width="20" height="20" fill="#333" />
      <text x="310" y="350" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.faceToFace.qrCode", "QR Code")}
      </text>

      {/* Link Icon */}
      <circle cx="430" cy="300" r="30" fill="#2196f3" />
      <text x="430" y="295" fontSize="20" textAnchor="middle" fill="white">
        🔗
      </text>
      <text x="430" y="350" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.faceToFace.shareLink", "Share Link")}
      </text>

      {/* Share methods text */}
      <text x="520" y="285" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.faceToFace.shareVia", "Share via:")}
      </text>
      <text x="520" y="300" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.faceToFace.whatsapp", "• WhatsApp")}
      </text>
      <text x="520" y="315" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.faceToFace.telegram", "• Telegram")}
      </text>
      <text x="520" y="330" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.faceToFace.wechat", "• WeChat, etc.")}
      </text>

      {/* Arrow from step 1 to step 2 */}
      <path
        d="M 210 270 L 240 270"
        stroke="#ff9800"
        strokeWidth="3"
        fill="none"
        markerEnd="url(#arrowOrange)"
      />

      {/* Step 3: Borrower Access */}
      <rect
        x="590"
        y="230"
        width="180"
        height="120"
        fill="#e3f2fd"
        stroke="#2196f3"
        strokeWidth="3"
        rx="8"
      />
      <text
        x="680"
        y="255"
        fontSize="14"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t("diagram.faceToFace.step3Title", "3. Borrower Access")}
      </text>
      <text x="680" y="275" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.faceToFace.step3Line1", "Scan QR or")}
      </text>
      <text x="680" y="290" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.faceToFace.step3Line2", "Click link")}
      </text>
      <path
        d="M 680 165 L 680 230"
        stroke="#2196f3"
        strokeWidth="3"
        fill="none"
        markerEnd="url(#arrowBlue)"
      />

      {/* Quick Signup Option */}
      <rect
        x="610"
        y="305"
        width="140"
        height="35"
        fill="#fff9c4"
        stroke="#fbc02d"
        strokeWidth="2"
        rx="5"
      />
      <text
        x="680"
        y="320"
        fontSize="10"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t("diagram.faceToFace.ifNotUser", "If not user:")}
      </text>
      <text x="680" y="333" fontSize="9" textAnchor="middle" fill="#666">
        {t("diagram.faceToFace.quickSignup", "Quick signup available")}
      </text>

      {/* Arrow from step 2 to step 3 */}
      <path
        d="M 560 290 L 590 290"
        stroke="#2196f3"
        strokeWidth="3"
        fill="none"
        markerEnd="url(#arrowBlue)"
      />

      {/* Step 4: Confirm Receipt with Photo */}
      <ellipse
        cx="400"
        cy="440"
        rx="180"
        ry="80"
        fill="#f3e5f5"
        stroke="#9c27b0"
        strokeWidth="3"
      />
      <text
        x="400"
        y="415"
        fontSize="15"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t("diagram.faceToFace.step4Title", "4. Confirm Receipt")}
      </text>
      <text x="400" y="435" fontSize="12" textAnchor="middle" fill="#666">
        {t("diagram.faceToFace.step4Line1", "Borrower inspects item")}
      </text>
      <text x="400" y="452" fontSize="12" textAnchor="middle" fill="#666">
        {t("diagram.faceToFace.step4Line2", "📸 Take photo as record")}
      </text>
      <text
        x="400"
        y="469"
        fontSize="12"
        textAnchor="middle"
        fill="#666"
        fontWeight="bold"
      >
        {t("diagram.faceToFace.step4Line3", 'Click "Receive Item"')}
      </text>

      {/* Arrows to step 4 from both sides */}
      <path
        d="M 120 310 L 120 380 L 250 420"
        stroke="#9c27b0"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowPurple)"
        strokeDasharray="5,5"
      />
      <path
        d="M 680 350 L 680 380 L 550 420"
        stroke="#9c27b0"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowPurple)"
        strokeDasharray="5,5"
      />
      <text
        x="180"
        y="350"
        fontSize="10"
        textAnchor="middle"
        fill="#666"
        fontStyle="italic"
      >
        {t("diagram.faceToFace.bothPresent", "Both present")}
      </text>
      <text
        x="620"
        y="370"
        fontSize="10"
        textAnchor="middle"
        fill="#666"
        fontStyle="italic"
      >
        {t("diagram.faceToFace.atExchange", "at exchange")}
      </text>

      {/* Step 5: Transaction Complete */}
      <rect
        x="300"
        y="565"
        width="200"
        height="50"
        fill="#4caf50"
        stroke="#2e7d32"
        strokeWidth="3"
        rx="8"
      />
      <text
        x="400"
        y="585"
        fontSize="14"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t("diagram.faceToFace.complete", "✓ Transaction Complete")}
      </text>
      <text x="400" y="603" fontSize="11" textAnchor="middle" fill="white">
        {t("diagram.faceToFace.newHolder", "Borrower is new holder")}
      </text>

      {/* Arrow to complete */}
      <path
        d="M 400 520 L 400 565"
        stroke="#4caf50"
        strokeWidth="3"
        fill="none"
        markerEnd="url(#arrowGreen)"
      />

      {/* Arrow markers */}
      <defs>
        <marker
          id="arrowOrange"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#ff9800" />
        </marker>
        <marker
          id="arrowGreen"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#4caf50" />
        </marker>
        <marker
          id="arrowBlue"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#2196f3" />
        </marker>
        <marker
          id="arrowPurple"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#9c27b0" />
        </marker>
      </defs>

      {/* Time Note */}
      <text
        x="400"
        y="635"
        fontSize="11"
        textAnchor="middle"
        fill="#d32f2f"
        fontStyle="italic"
      >
        {t(
          "diagram.faceToFace.timeNote",
          "⏱ Must complete within 1 hour or transaction expires"
        )}
      </text>

      {/* Use Case Note */}
      <rect
        x="50"
        y="30"
        width="240"
        height="30"
        fill="#e3f2fd"
        stroke="#2196f3"
        strokeWidth="1"
        rx="5"
      />
      <text
        x="170"
        y="50"
        fontSize="10"
        textAnchor="middle"
        fill="#1976d2"
        fontStyle="italic"
      >
        {t(
          "diagram.faceToFace.useCase",
          "💡 Perfect for book clubs, meetups, events"
        )}
      </text>
    </svg>
  );
};

// Direct Exchange Transaction SVG - REVISED WITH DETAILED WORKFLOW
export const DirectExchangeDiagram: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <svg
      viewBox="0 0 900 650"
      xmlns="http://www.w3.org/2000/svg"
      key={i18n.language}
    >
      {/* Title */}
      <text
        x="450"
        y="30"
        fontSize="20"
        fontWeight="bold"
        textAnchor="middle"
        fill="#1976d2"
      >
        {t(
          "diagram.directExchange.title",
          "Direct Exchange at Agreed Location"
        )}
      </text>
      <text
        x="450"
        y="50"
        fontSize="12"
        textAnchor="middle"
        fill="#666"
        fontStyle="italic"
      >
        {t(
          "diagram.directExchange.subtitle",
          "(Both parties coordinate meeting for handover)"
        )}
      </text>

      {/* User/Requestor (Left) */}
      <circle cx="150" cy="100" r="40" fill="#2196f3" />
      <text
        x="150"
        y="105"
        fontSize="14"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t("diagram.roles.user", "User/")}
      </text>
      <text
        x="150"
        y="120"
        fontSize="14"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t("diagram.roles.requestor", "Requestor")}
      </text>

      {/* Owner (Center) */}
      <circle cx="450" cy="100" r="40" fill="#4caf50" />
      <text
        x="450"
        y="110"
        fontSize="14"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t("diagram.roles.owner", "Owner")}
      </text>

      {/* Holder (Right) */}
      <circle cx="750" cy="100" r="40" fill="#ff9800" />
      <text
        x="750"
        y="110"
        fontSize="14"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t("diagram.roles.holder", "Holder")}
      </text>
      <text
        x="750"
        y="155"
        fontSize="10"
        textAnchor="middle"
        fill="#666"
        fontStyle="italic"
      >
        {t("diagram.roles.ifDifferent", "(if different from owner)")}
      </text>

      {/* Step 1: User finds item and submits request */}
      <rect
        x="50"
        y="190"
        width="200"
        height="100"
        fill="#e3f2fd"
        stroke="#2196f3"
        strokeWidth="3"
        rx="8"
      />
      <text
        x="150"
        y="215"
        fontSize="14"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t("diagram.directExchange.step1Title", "1. Find & Request")}
      </text>
      <text x="150" y="235" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step1Line1", "User finds item")}
      </text>
      <text x="150" y="250" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step1Line2", "Submits request with")}
      </text>
      <text x="150" y="265" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step1Line3", "proposed handover")}
      </text>
      <text x="150" y="280" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step1Line4", "location")}
      </text>

      {/* Arrow from requestor to step 1 */}
      <path
        d="M 150 140 L 150 190"
        stroke="#2196f3"
        strokeWidth="3"
        fill="none"
        markerEnd="url(#arrowBlue2)"
      />

      {/* Step 2: Email notification */}
      <rect
        x="300"
        y="190"
        width="300"
        height="100"
        fill="#fff9c4"
        stroke="#fbc02d"
        strokeWidth="3"
        rx="8"
      />
      <text
        x="450"
        y="215"
        fontSize="14"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t("diagram.directExchange.step2Title", "2. Email Notification")}
      </text>
      <text x="450" y="235" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step2Line1", "📧 System sends email to:")}
      </text>
      <text x="450" y="252" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step2Line2", "• Requestor (confirmation)")}
      </text>
      <text x="450" y="267" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step2Line3", "• Owner (approval needed)")}
      </text>
      <text x="450" y="282" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step2Line4", "• Holder (if different)")}
      </text>

      {/* Arrow from step 1 to step 2 */}
      <path
        d="M 250 240 L 300 240"
        stroke="#fbc02d"
        strokeWidth="3"
        fill="none"
        markerEnd="url(#arrowYellow)"
      />

      {/* Step 3: Owner decision */}
      <rect
        x="650"
        y="190"
        width="200"
        height="100"
        fill="#e8f5e9"
        stroke="#4caf50"
        strokeWidth="3"
        rx="8"
      />
      <text
        x="750"
        y="215"
        fontSize="14"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t("diagram.directExchange.step3Title", "3. Owner Decision")}
      </text>
      <text x="750" y="235" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step3Line1", "✓ Approve: Accept all")}
      </text>
      <text x="750" y="250" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step3Line2", "✗ Negotiate: Discuss")}
      </text>
      <text x="750" y="265" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step3Line3", "via email/chat for")}
      </text>
      <text x="750" y="280" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step3Line4", "changes (location, etc.)")}
      </text>

      {/* Arrow from step 2 to step 3 */}
      <path
        d="M 600 240 L 650 240"
        stroke="#4caf50"
        strokeWidth="3"
        fill="none"
        markerEnd="url(#arrowGreen2)"
      />

      {/* Negotiation box */}
      <rect
        x="300"
        y="310"
        width="300"
        height="60"
        fill="#ffebee"
        stroke="#f44336"
        strokeWidth="2"
        rx="8"
        strokeDasharray="5,5"
      />
      <text
        x="450"
        y="335"
        fontSize="12"
        textAnchor="middle"
        fill="#d32f2f"
        fontWeight="bold"
      >
        {t("diagram.directExchange.negotiation", "If Changes Needed:")}
      </text>
      <text x="450" y="352" fontSize="10" textAnchor="middle" fill="#666">
        {t(
          "diagram.directExchange.negotiationDesc",
          "Requestor cancels → Submits new request → Owner approves"
        )}
      </text>

      {/* Arrow from owner to negotiation */}
      <path
        d="M 750 290 L 750 340 L 600 340"
        stroke="#f44336"
        strokeWidth="2"
        fill="none"
        strokeDasharray="5,5"
      />

      {/* Step 4: Coordinate meeting */}
      <rect
        x="50"
        y="400"
        width="800"
        height="80"
        fill="#f3e5f5"
        stroke="#9c27b0"
        strokeWidth="3"
        rx="8"
      />
      <text
        x="450"
        y="425"
        fontSize="15"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t("diagram.directExchange.step4Title", "4. Coordinate Handover")}
      </text>
      <text x="450" y="445" fontSize="12" textAnchor="middle" fill="#666">
        {t(
          "diagram.directExchange.step4Desc",
          "💬 Both parties discuss when and how to meet face-to-face"
        )}
      </text>
      <text x="450" y="465" fontSize="11" textAnchor="middle" fill="#999">
        {t(
          "diagram.directExchange.step4Note",
          "(via email, phone, or messaging app)"
        )}
      </text>

      {/* Arrows to step 4 */}
      <path
        d="M 150 290 L 150 400"
        stroke="#9c27b0"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowPurple2)"
      />
      <path
        d="M 750 290 L 750 400"
        stroke="#9c27b0"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowPurple2)"
      />

      {/* Step 5: Transfer */}
      <ellipse
        cx="250"
        cy="540"
        rx="120"
        ry="50"
        fill="#fff3e0"
        stroke="#ff9800"
        strokeWidth="3"
      />
      <text
        x="250"
        y="530"
        fontSize="14"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t("diagram.directExchange.step5Title", "5. Handover")}
      </text>
      <text x="250" y="548" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step5Line1", "Owner/Holder hands over")}
      </text>
      <text x="250" y="563" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step5Line2", "Clicks 'Transferred'")}
      </text>

      {/* Arrow to transfer */}
      <path
        d="M 450 480 L 250 490"
        stroke="#ff9800"
        strokeWidth="3"
        fill="none"
        markerEnd="url(#arrowOrange2)"
      />

      {/* Step 6: Receive & Photo */}
      <ellipse
        cx="650"
        cy="540"
        rx="130"
        ry="50"
        fill="#e3f2fd"
        stroke="#2196f3"
        strokeWidth="3"
      />
      <text
        x="650"
        y="525"
        fontSize="14"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t("diagram.directExchange.step6Title", "6. Receive & Record")}
      </text>
      <text x="650" y="543" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step6Line1", "📸 Requestor takes photo")}
      </text>
      <text x="650" y="558" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.directExchange.step6Line2", "Clicks 'Received'")}
      </text>

      {/* Arrow to receive */}
      <path
        d="M 450 480 L 650 490"
        stroke="#2196f3"
        strokeWidth="3"
        fill="none"
        markerEnd="url(#arrowBlue2)"
      />

      {/* Connection between steps */}
      <path
        d="M 370 540 L 520 540"
        stroke="#9c27b0"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowPurple2)"
      />
      <text
        x="445"
        y="530"
        fontSize="10"
        textAnchor="middle"
        fill="#9c27b0"
        fontWeight="bold"
      >
        {t("diagram.directExchange.faceToFace", "Face-to-face")}
      </text>

      {/* Step 7: New Holder */}
      <rect
        x="550"
        y="605"
        width="200"
        height="40"
        fill="#4caf50"
        stroke="#2e7d32"
        strokeWidth="3"
        rx="8"
      />
      <text
        x="650"
        y="630"
        fontSize="13"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t("diagram.directExchange.complete", "✓ Requestor becomes new Holder")}
      </text>

      {/* Arrow to complete */}
      <path
        d="M 650 590 L 650 605"
        stroke="#4caf50"
        strokeWidth="3"
        fill="none"
        markerEnd="url(#arrowGreen2)"
      />

      {/* Return flow note */}
      <rect
        x="50"
        y="605"
        width="400"
        height="40"
        fill="#e1f5fe"
        stroke="#0288d1"
        strokeWidth="2"
        rx="8"
      />
      <text
        x="250"
        y="630"
        fontSize="11"
        textAnchor="middle"
        fill="#01579b"
        fontWeight="bold"
      >
        {t(
          "diagram.directExchange.returnNote",
          "🔄 For Return: Owner requests from Holder (auto-approved, same workflow)"
        )}
      </text>

      {/* Arrow markers */}
      <defs>
        <marker
          id="arrowOrange2"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#ff9800" />
        </marker>
        <marker
          id="arrowGreen2"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#4caf50" />
        </marker>
        <marker
          id="arrowBlue2"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#2196f3" />
        </marker>
        <marker
          id="arrowPurple2"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#9c27b0" />
        </marker>
        <marker
          id="arrowYellow"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#fbc02d" />
        </marker>
      </defs>
    </svg>
  );
};

// Exchange Point Transaction SVG - REVISED WITH TWO-PHASE WORKFLOW
export const ExchangePointDiagram: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <svg
      viewBox="0 0 900 750"
      xmlns="http://www.w3.org/2000/svg"
      key={i18n.language}
    >
      {/* Title */}
      <text
        x="450"
        y="30"
        fontSize="20"
        fontWeight="bold"
        textAnchor="middle"
        fill="#1976d2"
      >
        {t("diagram.exchangePoint.title", "Exchange via Public Exchange Point")}
      </text>
      <text
        x="450"
        y="50"
        fontSize="12"
        textAnchor="middle"
        fill="#666"
        fontStyle="italic"
      >
        {t(
          "diagram.exchangePoint.subtitle",
          "(Two separate transactions via trusted intermediary)"
        )}
      </text>

      {/* Background Note */}
      <rect
        x="50"
        y="70"
        width="800"
        height="40"
        fill="#fff9c4"
        stroke="#fbc02d"
        strokeWidth="2"
        rx="5"
      />
      <text
        x="450"
        y="95"
        fontSize="11"
        textAnchor="middle"
        fill="#f57f17"
        fontWeight="bold"
      >
        {t(
          "diagram.exchangePoint.backgroundNote",
          "💡 Use Case: When parties can't find suitable time/location → Cancel direct exchange → Choose exchange point"
        )}
      </text>

      {/* Participants */}
      <circle cx="300" cy="150" r="35" fill="#4caf50" />
      <text
        x="300"
        y="148"
        fontSize="12"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t("diagram.roles.owner", "Owner/")}
      </text>
      <text
        x="300"
        y="162"
        fontSize="12"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t("diagram.roles.holder", "Holder")}
      </text>

      <rect
        x="390"
        y="115"
        width="120"
        height="70"
        fill="#ff9800"
        stroke="#f57c00"
        strokeWidth="3"
        rx="5"
      />
      <text
        x="450"
        y="145"
        fontSize="13"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t("diagram.exchangePoint.exchangePoint", "Exchange")}
      </text>
      <text
        x="450"
        y="162"
        fontSize="13"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t("diagram.exchangePoint.exchangePoint2", "Point")}
      </text>
      <text x="450" y="178" fontSize="10" textAnchor="middle" fill="white">
        {t("diagram.exchangePoint.intermediary", "(Trusted)")}
      </text>

      <circle cx="800" cy="150" r="35" fill="#2196f3" />
      <text
        x="800"
        y="155"
        fontSize="12"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t("diagram.roles.requestor", "Requestor")}
      </text>

      {/* Phase A Header */}
      <rect
        x="50"
        y="220"
        width="380"
        height="40"
        fill="#e8f5e9"
        stroke="#4caf50"
        strokeWidth="3"
        rx="8"
      />
      <text
        x="240"
        y="245"
        fontSize="16"
        textAnchor="middle"
        fill="#2e7d32"
        fontWeight="bold"
      >
        {t(
          "diagram.exchangePoint.phaseATitle",
          "PHASE A: Drop-off Transaction"
        )}
      </text>

      {/* Phase A Step 1: Request */}
      <rect
        x="60"
        y="280"
        width="160"
        height="90"
        fill="#e3f2fd"
        stroke="#2196f3"
        strokeWidth="2"
        rx="8"
      />
      <text
        x="140"
        y="305"
        fontSize="13"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t("diagram.exchangePoint.phaseA1Title", "A1. Request Drop-off")}
      </text>
      <text x="140" y="323" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseA1Line1", "Owner/Holder requests")}
      </text>
      <text x="140" y="338" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseA1Line2", "exchange point to")}
      </text>
      <text x="140" y="353" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseA1Line3", "receive item")}
      </text>

      {/* Arrow from holder */}
      <path
        d="M 300 185 L 300 280"
        stroke="#4caf50"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowBlue4)"
      />

      {/* Phase A Step 2: Email & Approve */}
      <rect
        x="240"
        y="280"
        width="180"
        height="90"
        fill="#fff9c4"
        stroke="#fbc02d"
        strokeWidth="2"
        rx="8"
      />
      <text
        x="330"
        y="305"
        fontSize="13"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t("diagram.exchangePoint.phaseA2Title", "A2. Email & Approve")}
      </text>
      <text x="330" y="323" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseA2Line1", "📧 Exchange Point")}
      </text>
      <text x="330" y="338" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseA2Line2", "confirms via email")}
      </text>
      <text x="330" y="353" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseA2Line3", "Approve drop-off time")}
      </text>

      {/* Arrow A1 to A2 */}
      <path
        d="M 220 325 L 240 325"
        stroke="#fbc02d"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowYellow2)"
      />

      {/* Phase A Step 3: Handover */}
      <rect
        x="60"
        y="390"
        width="360"
        height="90"
        fill="#f3e5f5"
        stroke="#9c27b0"
        strokeWidth="3"
        rx="8"
      />
      <text
        x="240"
        y="415"
        fontSize="14"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t(
          "diagram.exchangePoint.phaseA3Title",
          "A3. Handover at Exchange Point"
        )}
      </text>
      <text x="240" y="435" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseA3Line1", "Owner/Holder delivers item")}
      </text>
      <text x="240" y="452" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseA3Line2", "📸 Both take photos")}
      </text>
      <text x="240" y="469" fontSize="11" textAnchor="middle" fill="#666">
        {t(
          "diagram.exchangePoint.phaseA3Line3",
          "Click 'Transferred' & 'Received'"
        )}
      </text>

      {/* Arrows to A3 */}
      <path
        d="M 140 370 L 140 390"
        stroke="#9c27b0"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowPurple4)"
      />
      <path
        d="M 330 370 L 330 390"
        stroke="#9c27b0"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowPurple4)"
      />

      {/* Phase A Complete */}
      <ellipse
        cx="240"
        cy="510"
        rx="100"
        ry="30"
        fill="#4caf50"
        stroke="#2e7d32"
        strokeWidth="2"
      />
      <text
        x="240"
        y="517"
        fontSize="12"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t("diagram.exchangePoint.phaseAComplete", "✓ Phase A Complete")}
      </text>

      {/* Arrow to Phase A complete */}
      <path
        d="M 240 480 L 240 490"
        stroke="#4caf50"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowGreen4)"
      />

      {/* Transition Note */}
      <rect
        x="460"
        y="380"
        width="200"
        height="80"
        fill="#e1f5fe"
        stroke="#0288d1"
        strokeWidth="2"
        rx="8"
        strokeDasharray="5,5"
      />
      <text
        x="560"
        y="405"
        fontSize="12"
        textAnchor="middle"
        fill="#01579b"
        fontWeight="bold"
      >
        {t("diagram.exchangePoint.itemCached", "📦 Item Cached")}
      </text>
      <text x="560" y="425" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.waitingPickup", "Waiting for")}
      </text>
      <text x="560" y="440" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.waitingPickup2", "Phase B pickup")}
      </text>

      {/* Arrow from Exchange Point to transition */}
      <path
        d="M 420 435 L 460 435"
        stroke="#0288d1"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowCyan)"
        strokeDasharray="5,5"
      />

      {/* Phase B Header */}
      <rect
        x="470"
        y="220"
        width="380"
        height="40"
        fill="#e3f2fd"
        stroke="#2196f3"
        strokeWidth="3"
        rx="8"
      />
      <text
        x="660"
        y="245"
        fontSize="16"
        textAnchor="middle"
        fill="#1565c0"
        fontWeight="bold"
      >
        {t("diagram.exchangePoint.phaseBTitle", "PHASE B: Pick-up Transaction")}
      </text>

      {/* Phase B Step 1: Request */}
      <rect
        x="680"
        y="280"
        width="160"
        height="90"
        fill="#e3f2fd"
        stroke="#2196f3"
        strokeWidth="2"
        rx="8"
      />
      <text
        x="760"
        y="305"
        fontSize="13"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t("diagram.exchangePoint.phaseB1Title", "B1. Request Pick-up")}
      </text>
      <text x="760" y="323" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseB1Line1", "Requestor submits")}
      </text>
      <text x="760" y="338" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseB1Line2", "pick-up request to")}
      </text>
      <text x="760" y="353" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseB1Line3", "exchange point")}
      </text>

      {/* Arrow from requestor */}
      <path
        d="M 800 185 L 800 315 L 840 315"
        stroke="#2196f3"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowBlue4)"
      />

      <path
        d="M 800 185 L 800 200 L 100 200 L 100 280"
        stroke="#2196f3"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowBlue4)"
      />

      {/* Phase B Step 2: Email & Approve */}
      <rect
        x="480"
        y="280"
        width="180"
        height="90"
        fill="#fff9c4"
        stroke="#fbc02d"
        strokeWidth="2"
        rx="8"
      />
      <text
        x="570"
        y="305"
        fontSize="13"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t("diagram.exchangePoint.phaseB2Title", "B2. Email & Approve")}
      </text>
      <text x="570" y="323" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseB2Line1", "📧 Exchange Point")}
      </text>
      <text x="570" y="338" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseB2Line2", "confirms via email")}
      </text>
      <text x="570" y="353" fontSize="10" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseB2Line3", "Approve pick-up time")}
      </text>

      {/* Arrow B1 to B2 */}
      <path
        d="M 680 325 L 660 325"
        stroke="#fbc02d"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowYellow2)"
      />

      {/* Phase B Step 3: Pickup */}
      <rect
        x="480"
        y="500"
        width="360"
        height="90"
        fill="#f3e5f5"
        stroke="#9c27b0"
        strokeWidth="3"
        rx="8"
      />
      <text
        x="660"
        y="525"
        fontSize="14"
        textAnchor="middle"
        fill="#333"
        fontWeight="bold"
      >
        {t(
          "diagram.exchangePoint.phaseB3Title",
          "B3. Pick-up at Exchange Point"
        )}
      </text>
      <text x="660" y="545" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseB3Line1", "Requestor picks up item")}
      </text>
      <text x="660" y="562" fontSize="11" textAnchor="middle" fill="#666">
        {t("diagram.exchangePoint.phaseB3Line2", "📸 Both take photos")}
      </text>
      <text x="660" y="579" fontSize="11" textAnchor="middle" fill="#666">
        {t(
          "diagram.exchangePoint.phaseB3Line3",
          "Click 'Transferred' & 'Received'"
        )}
      </text>

      {/* Arrows to B3 */}
      <path
        d="M 570 370 L 570 500"
        stroke="#9c27b0"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowPurple4)"
      />
      <path
        d="M 760 370 L 760 500"
        stroke="#9c27b0"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowPurple4)"
      />

      {/* Phase B Complete - New Holder */}
      <ellipse
        cx="660"
        cy="620"
        rx="130"
        ry="35"
        fill="#4caf50"
        stroke="#2e7d32"
        strokeWidth="3"
      />
      <text
        x="660"
        y="625"
        fontSize="13"
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {t(
          "diagram.exchangePoint.phaseBComplete",
          "✓ Requestor becomes new Holder"
        )}
      </text>

      {/* Arrow to Phase B complete */}
      <path
        d="M 660 590 L 660 600"
        stroke="#4caf50"
        strokeWidth="3"
        fill="none"
        markerEnd="url(#arrowGreen4)"
      />

      {/* Exchange Point Preference Note */}
      <rect
        x="50"
        y="680"
        width="800"
        height="60"
        fill="#e8eaf6"
        stroke="#5c6bc0"
        strokeWidth="2"
        rx="8"
      />
      <text
        x="450"
        y="705"
        fontSize="12"
        textAnchor="middle"
        fill="#283593"
        fontWeight="bold"
      >
        {t(
          "diagram.exchangePoint.preferenceNote",
          "📍 Exchange Point Preferences:"
        )}
      </text>
      <text x="450" y="725" fontSize="11" textAnchor="middle" fill="#666">
        {t(
          "diagram.exchangePoint.preferenceDesc",
          "Users can select preferred exchange points. Others can search items by exchange point location."
        )}
      </text>

      {/* Arrow markers */}
      <defs>
        <marker
          id="arrowBlue4"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#2196f3" />
        </marker>
        <marker
          id="arrowGreen4"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#4caf50" />
        </marker>
        <marker
          id="arrowPurple4"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#9c27b0" />
        </marker>
        <marker
          id="arrowYellow2"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#fbc02d" />
        </marker>
        <marker
          id="arrowCyan"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#0288d1" />
        </marker>
      </defs>

      {/* Time Note */}
      <text
        x="450"
        y="665"
        fontSize="11"
        textAnchor="middle"
        fill="#d32f2f"
        fontStyle="italic"
      >
        {t(
          "diagram.exchangePoint.timeNote",
          "⏱ Each phase: 14 days to complete or transaction expires"
        )}
      </text>
    </svg>
  );
};

// Main component that exports all diagrams
export const TransactionFlowDiagrams: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        {t("transactions.howItWorks", "How Transactions Work")}
      </Typography>

      <Grid container spacing={3}>
        {/* Face-to-Face */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              {t(
                "transactions.faceToFaceTitle",
                "1. Face-to-Face Quick Exchange"
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t(
                "transactions.faceToFaceDesc",
                "Perfect for events, meetups, or quick lending. The holder initiates the transaction and shares it via QR code or link. The borrower (even if not a registered user) can quickly sign up and complete the exchange with a photo record. Must be completed within 1 hour."
              )}
            </Typography>
            <Box sx={{ width: "100%", maxWidth: "800px", mx: "auto" }}>
              <FaceToFaceDiagram />
            </Box>

            {/* Key Features */}
            <Box sx={{ mt: 2, p: 2, bgcolor: "info.lighter", borderRadius: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, fontWeight: "bold", color: "info.dark" }}
              >
                {t("transactions.keyFeatures", "Key Features")}:
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
                <li>
                  {t(
                    "transactions.feature1",
                    "Holder initiates transaction (self-request)"
                  )}
                </li>
                <li>
                  {t(
                    "transactions.feature2",
                    "Share via QR code or messaging apps (WhatsApp, Telegram, etc.)"
                  )}
                </li>
                <li>
                  {t(
                    "transactions.feature3",
                    "Quick signup available for non-users"
                  )}
                </li>
                <li>
                  {t(
                    "transactions.feature4",
                    "Photo documentation of item condition"
                  )}
                </li>
                <li>
                  {t("transactions.feature5", "1-hour completion window")}
                </li>
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Direct Exchange */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              {t(
                "transactions.directExchangeTitle",
                "2. Direct Exchange at Address"
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t(
                "transactions.directExchangeDesc",
                "Meet at either the holder's or requestor's address. Both parties coordinate meeting time and location. Suitable for planned exchanges with 14-day completion window."
              )}
            </Typography>
            <Box sx={{ width: "100%", maxWidth: "800px", mx: "auto" }}>
              <DirectExchangeDiagram />
            </Box>
          </Paper>
        </Grid>

        {/* Exchange Point */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              {t(
                "transactions.exchangePointTitle",
                "3. Exchange via Public Exchange Point"
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t(
                "transactions.exchangePointDesc",
                "Two-phase exchange using a trusted public location. Holder drops off item, then requestor picks it up at their convenience. Each phase has 14-day completion window."
              )}
            </Typography>
            <Box sx={{ width: "100%", maxWidth: "800px", mx: "auto" }}>
              <ExchangePointDiagram />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Legend */}
      <Paper elevation={1} sx={{ p: 2, mt: 3, bgcolor: "grey.50" }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
          {t("transactions.legend", "Legend")}:
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  bgcolor: "#ff9800",
                  borderRadius: "50%",
                }}
              />
              <Typography variant="body2">
                {t("transactions.statusPending", "Pending / Request")}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  bgcolor: "#4caf50",
                  borderRadius: "50%",
                }}
              />
              <Typography variant="body2">
                {t("transactions.statusApproved", "Approved")}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  bgcolor: "#2196f3",
                  borderRadius: "50%",
                }}
              />
              <Typography variant="body2">
                {t("transactions.statusTransferred", "Transferred")}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  bgcolor: "#9c27b0",
                  borderRadius: "50%",
                }}
              />
              <Typography variant="body2">
                {t("transactions.statusCompleted", "Completed")}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default TransactionFlowDiagrams;
