/**
 * Jasoos — App Root
 * Phase 5: Email detail inspector modal + manual status override capability.
 */

import React, { useState } from 'react';
import { useInbox } from './context/InboxContext.jsx';
import Header from './components/Header.jsx';
import MetricCards from './components/MetricCards.jsx';
import SuspiciousAlerts from './components/SuspiciousAlerts.jsx';
import FollowUpReminders from './components/FollowUpReminders.jsx';
import FilterBar from './components/FilterBar.jsx';
import TrackerTable from './components/TrackerTable.jsx';
import EmailDetailModal from './components/EmailDetailModal.jsx';

// ─────────────────────────────────────────────
// App Root
// ─────────────────────────────────────────────
export default function App() {
  const { analyses, selectedEmailId, setSelectedEmailId } = useInbox();
  const [modalEmailId, setModalEmailId] = useState(null);

  const analysisReady = analyses.length > 0;

  function openModal(emailId) {
    setSelectedEmailId(emailId);
    setModalEmailId(emailId);
  }

  function closeModal() {
    setModalEmailId(null);
  }

  return (
    <div className="app-root">
      {/* ── Header ── */}
      <Header />

      {/* ── Metric Cards ── */}
      <MetricCards />

      {/* ── Priority Boards (only when analysis ready) ── */}
      {analysisReady && (
        <div className="priority-boards-row">
          <SuspiciousAlerts onViewEmail={openModal} />
          <FollowUpReminders onViewEmail={openModal} />
        </div>
      )}

      {/* ── Filter Bar (only when analysis ready) ── */}
      {analysisReady && <FilterBar />}

      {/* ── Application Tracker ── */}
      <div className="main-content-grid">
        <TrackerTable onViewEmail={openModal} />
      </div>

      {/* ── Email Detail Modal (Phase 5) ── */}
      <EmailDetailModal
        emailId={modalEmailId}
        onClose={closeModal}
      />
    </div>
  );
}
