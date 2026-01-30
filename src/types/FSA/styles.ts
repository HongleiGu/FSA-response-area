import { makeStyles } from "@styles";

export const useLocalStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    height: 600,
    display: 'flex',
    border: '1px solid #ddd',
    fontFamily: 'sans-serif',
    position: 'relative',
  },

  panel: {
    width: 280,
    padding: theme.spacing(2),
    borderRight: '1px solid #ddd',
    backgroundColor: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    overflowY: 'auto'
  },

  floatingConfig: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 320,
    maxHeight: 420,
    backgroundColor: '#fafafa',
    border: '1px solid #ddd',
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10,
  },

  configHeader: {
    padding: theme.spacing(1),
    fontWeight: 600,
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },

  configBody: {
    padding: theme.spacing(1.5),
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  },

  panelTitle: {
    fontWeight: 600,
    fontSize: 16,
    borderBottom: '1px solid #eee',
    paddingBottom: theme.spacing(1),
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },

  inputField: {
    padding: '6px 8px',
    border: '1px solid #ccc',
    borderRadius: 4,
  },

  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },

  addButton: {
    padding: '6px 10px',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: 4,
    cursor: 'pointer',
  },

  deleteButton: {
    padding: '6px',
    backgroundColor: '#fff1f0',
    color: '#cf1322',
    border: '1px solid #ffa39e',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 600,
  },

  cyWrapper: {
    flexGrow: 1,
  },
}))