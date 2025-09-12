# School Fee Management System - User Guide

## Introduction

Welcome to the School Fee Management System! This guide provides a comprehensive overview of all the features and a step-by-step walkthrough on how to use the application to manage your school's finances efficiently. This system is designed to automate recurring tasks and provide a clear, centralized view of each student's financial status.

---

## Section 1: Initial Setup (One-Time Task)

This section covers the initial setup required to define your school's fee types. This is typically done once when first setting up the application.

### 1.1. Defining Fee Structures

Fee Structures are the master templates for every type of fee your school charges. You create them once, and then apply them to students.

1.  Navigate to the **Fee Structures** page from the main admin sidebar.
2.  Click the **"Create Structure"** button.
3.  Fill in the form:
    - **Fee Type:** The name of the fee (e.g., "Tuition Fee", "Admission Fee", "Conveyance Fee").
    - **Amount (₹):** The standard monetary value of this fee.
    - **Recurrence:** This is the most important setting for automation.
      - `One-Time`: For fees that are charged only once (e.g., Admission Fee).
      - `Monthly`: For fees that are charged every month (e.g., Tuition Fee, Conveyance Fee).
      - `Yearly`: For fees that are charged once a year (e.g., Re-admission Fee).
    - **Apply this fee to all new students by default?:** If you check this box, this fee rule will be automatically applied to every new student that is registered in the system. This is recommended for universal fees like "Tuition Fee".
4.  Click **"Save Structure"**.

**Example Setup:**

- Create a structure named "Tuition Fee", give it an amount, set recurrence to `Monthly`, and check the `Default` box.
- Create a structure named "Admission Fee", give it an amount, and set recurrence to `One-Time`.
- Create a structure named "Conveyance Fee", give it an amount, set recurrence to `Monthly`, but **do not** check the `Default` box (as not all students use transport).

---

## Section 2: Managing a Student's Finances

This section explains the main day-to-day workflow for managing a student's complete financial record.

### 2.1. The Student Fee Ledger: Your Central Hub

The most powerful page for fee management is the **Student Fee Ledger**. To access it:

1.  Navigate to the **Students** page from the sidebar.
2.  Find the student you wish to manage.
3.  Click the three-dots menu icon (`...`) on their row and select **"View Fees"**.

This will take you to the student's dedicated fee page (`/admin/fees?studentId=...`), which is divided into two main parts.

### 2.2. Part 1: Managing Recurring Fee Rules

This top card, **"Recurring Fee Rules"**, is your control panel for automation for this specific student.

- **To Apply a New Rule:**

  1.  Click the **"Apply New Rule"** button.
  2.  Select a fee structure from the dropdown (e.g., "Conveyance Fee"). The dropdown cleverly hides rules that are already applied.
  3.  Click **"Apply Rule"**.

- **To Edit a Rule (Set a Custom Amount):**

  1.  Click the **Edit** (pencil) icon on an existing rule.
  2.  Enter a new amount in the **"Custom Amount"** field. This will override the default amount for this student only (useful for scholarships or concessions).
  3.  Click **"Save Changes"**.

- **To Activate or Deactivate a Rule:**

  1.  Use the **toggle switch** in the "Status" column.
  2.  Deactivating a rule (e.g., "Conveyance Fee") will stop the system from automatically generating this fee for the student in the future. This does not affect fees that have already been generated.

- **To Remove a Rule:**
  1.  Click the **Delete** (trash) icon. This will permanently remove the rule from the student.

### 2.3. Part 2: The Generated Fee Ledger

This bottom card, **"Generated Fee Ledger"**, shows the list of actual fee invoices that have been assigned to the student. This list is populated automatically by the recurring rules you've set up above, but you can also add fees manually.

- **To Add a Manual, One-Off Fee:**
  1.  Click the **"Create Fee"** button on this page.
  2.  Fill in the details for the occasional fee (e.g., "Fine for Damaged Library Book", "Science Fair Fee").
  3.  This fee will be added to the ledger instantly.

---

## Section 3: Recording Payments

Once fees are generated, you can record payments against them.

1.  From the student's Fee Ledger page, click the **"View Payment History"** button. This takes you to their dedicated payments page.
2.  Click the **"Record Payment"** button.
3.  The student's name will be pre-filled.
4.  In the **"Fee (Optional)"** dropdown, you can select the specific fee this payment is for. This helps in precise tracking.
5.  Fill in the amount, payment method, and date, then click **"Record Payment"**.

---

## Section 4: The Automation

Thanks to the cron job we set up, you do not need to do anything to generate recurring fees. The system runs every night at midnight, checks all the active rules for every student, and automatically creates the required `Monthly` and `Yearly` fees in their ledger. This ensures timely and accurate fee generation without any manual effort.

---

# How to Refactor This README for a Multi-School SaaS Platform (This is for the developer)

As you evolve the app, your README will need to change to reflect its new identity as a flexible, multi-tenant
platform. Here’s how you would refactor it:

1.  Title and Introduction:
2.  Key Features Section:
3.  Tech Stack:
4.  Getting Started / Environment Variables:
5.  Database Schema / Project Structure:
    By keeping your README in sync with your application's evolution, you maintain a professional and welcoming
    project for any developer who joins you on this exciting new journey.
