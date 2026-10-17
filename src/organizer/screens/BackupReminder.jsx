import { IoCloudUploadOutline } from 'react-icons/io5';
import { useOrganizer } from '../lib/context';
import { appleSeconds } from '../lib/dates';

const WEEK = 7 * 24 * 60 * 60;

/** Reminds once a week to save a password-protected copy, e.g. to Google Drive. */
export default function BackupReminder({ onOpenSettings }) {
  const { data, settings } = useOrganizer();
  const hasData = data.myTasks.length + data.words.length + data.journal.length + data.sonTasks.length > 0;
  const last = settings.lastExportAt;
  if (!hasData || (last && appleSeconds() - last < WEEK)) return null;
  return (
    <button type="button" className="org-banner" onClick={onOpenSettings}>
      <IoCloudUploadOutline aria-hidden="true" />
      <span>
        <strong>{last ? 'Time for this week’s backup' : 'Make your first backup'}</strong>
        <small>Your data lives only on this iPhone. Export a copy with a password.</small>
      </span>
    </button>
  );
}
