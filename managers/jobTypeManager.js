import { useEffect, useState, useMemo, useRef } from "react";
import { getSystemTypesWithSubtypes } from "../src/api/jobTypes";
import { fetchUserTypeCreationRequests, sendUserTypeCreationRequest } from "../src/api/jobTypesRegistration";
import { fetchUserProfessions, fetchUserTypeRequests, sendUserTypeRequest } from "../src/api/jobTypesRequests";
import { logError, logInfo } from "../utils/log_util";

function professionRequests({ session }) {
    const [professionsRequestedToSystem, setProfessionsRequestedToSystem] = useState([]);
    const [professionsRequestedBySystem, setProfessionsRequestedBySystem] = useState([]);

    const loadingRef = useRef(false);
    const pendingReloadRef = useRef(false);

    async function loadProfessionRequests() {
        if (!session?.status) return;

        if (loadingRef.current) {
            pendingReloadRef.current = true;
            return;
        }
        loadingRef.current = true;
        pendingReloadRef.current = false;

        try {
            const [regResult, reqResult, profResult] = await Promise.allSettled([
                fetchUserTypeCreationRequests(session),
                fetchUserTypeRequests(session),
                fetchUserProfessions(session)
            ]);

            const registrationRequestsData = regResult.status === 'fulfilled' ? regResult.value : null;
            const professionRequestsData = reqResult.status === 'fulfilled' ? reqResult.value : null;
            const userProfessionsData = profResult.status === 'fulfilled' ? profResult.value : null;

            const userRequested = [];
            const approvedKeys = new Set();

            if (userProfessionsData) {
                for (const profession of userProfessionsData) {
                    const key = `${profession.job_type_id}_${profession.job_subtype_id}`;
                    approvedKeys.add(key);
                    userRequested.push({ ...profession, status: 'approved' });
                }
            }

            if (professionRequestsData) {
                for (const req of professionRequestsData) {
                    if (req.status === 'approved') continue;
                    const key = `${req.job_type_id}_${req.job_subtype_id}`;
                    if (approvedKeys.has(key)) continue;
                    userRequested.push(req);
                }
            }

            if (registrationRequestsData) {
                setProfessionsRequestedToSystem(registrationRequestsData);
            }
            setProfessionsRequestedBySystem(userRequested);
        }
        catch (err) {
            logError('Error loading profession requests:', err);
        }
        finally {
            loadingRef.current = false;
            if (pendingReloadRef.current) {
                pendingReloadRef.current = false;
                loadProfessionRequests();
            }
        }
    }

    /**
     * @param {Object} requestData
     * @param {string} requestData.requested_type_name
     * @param {string} requestData.requested_subtype_name
     * @param {string} requestData.selected_type_id
     */
    async function requestProfessionToSystem(requestData) {
        try {
            const data = await sendUserTypeCreationRequest(session, requestData);
            if (data)
                setProfessionsRequestedToSystem(prev => [...prev, data]);

            loadProfessionRequests();
            return data;
        }
        catch (err) {
            logInfo('Error sending profession request:', err);
            throw err;
        }
    }

    /**
     * @param {Object} requestData
     * @param {string} requestData.job_type_id
     * @param {string} requestData.job_subtype_id
     * @param {string} requestData.passport_photo_urls
     * @param {string} requestData.certificate_photo_urls
     */
    async function requestProfessionToUser(requestData) { // { job_type_id, job_subtype_id, passport_photo_urls, certificate_photo_urls }
        try {
            const data = await sendUserTypeRequest(session, requestData);
            if (data)
                setProfessionsRequestedBySystem(prev => [...prev, data]);

            loadProfessionRequests();
            return data;
        }
        catch (err) {
            if (err?.response?.status === 400 || err?.response?.status === 409) {
                logInfo('Expected client error sending profession request to user:', err?.message);
            } else {
                logError('Error sending profession request to user:', err);
            }
            throw err;
        }
    }

    useEffect(() => {
        if (session?.status) {
            loadProfessionRequests();
        }
    }, [session?.status]);

    return {
        professionsRequestedToSystem,
        professionsRequestedBySystem,
        reloadProfessionRequests: loadProfessionRequests,
        requestProfessionToSystem,
        requestProfessionToUser
    }
}

export default function jobTypeManager({ session }) {
    const [jobTypesWithSubtypes, setJobTypesWithSubtypes] = useState([]);
    const [loadingJobTypes, setLoadingJobTypes] = useState(false);
    const [error, setError] = useState(null);

    const userProfessionRequests = professionRequests({ session });

    const token = session?.status;

    const approvedProfessions = useMemo(() => {
        const approved = new Set();

        userProfessionRequests.professionsRequestedBySystem.forEach(req => {
            if (req.status === 'approved') {
                if (req.job_type_id) approved.add(`type_${req.job_type_id}`);
                if (req.job_subtype_id) approved.add(`subtype_${req.job_subtype_id}`);
            }
        });

        userProfessionRequests.professionsRequestedToSystem.forEach(req => {
            if (req.status === 'approved') {
                if (req.final_type_id) approved.add(`type_${req.final_type_id}`);
                if (req.final_subtype_id) approved.add(`subtype_${req.final_subtype_id}`);
            }
        });

        return Array.from(approved);
    }, [userProfessionRequests.professionsRequestedBySystem, userProfessionRequests.professionsRequestedToSystem]);

    async function loadJobTypesWithSubtypes() {
        setLoadingJobTypes(true);
        setError(null);

        try {
            const data = await getSystemTypesWithSubtypes(session);

            if (data.typesWithSubtypes)
                setJobTypesWithSubtypes(data.typesWithSubtypes);
        }
        catch (err) {
            setError(err.message || 'Error loading job types with subtypes');
        }
        finally {
            setLoadingJobTypes(false);
        }
    }

    function checkIfVerificationNeeded({ typeId, subTypeId, typeKey, subTypeKey }) {
        try {
            if (!jobTypesWithSubtypes || jobTypesWithSubtypes.length === 0) {
                throw new Error('Job types with subtypes not loaded');
            }

            let type, subtype;

            if (typeId && subTypeId) {
                type = jobTypesWithSubtypes.find(t => t.id === typeId);
                if (!type) {
                    throw new Error('Job type not found by id');
                }
                subtype = type.subtypes.find(st => st.id === subTypeId);
                if (!subtype) {
                    throw new Error('Job subtype not found by id');
                }
            } else if (typeKey && subTypeKey) {
                type = jobTypesWithSubtypes.find(t => t.key === typeKey);
                if (!type) {
                    throw new Error('Job type not found by key');
                }
                subtype = type.subtypes.find(st => st.key === subTypeKey);
                if (!subtype) {
                    throw new Error('Job subtype not found by key');
                }
            } else {
                throw new Error('Insufficient parameters to find job type and subtype');
            }

            return type.requires_verification === true || subtype.requires_verification === true;
        } catch (err) {
            logInfo('Error in checkIfVerificationNeeded:', err);
            return false;
        }
    }

    useEffect(() => {
        if (token) loadJobTypesWithSubtypes();
    }, [token]);

    return {
        jobTypesWithSubtypes,
        checkIfVerificationNeeded,
        reloadJobTypes: loadJobTypesWithSubtypes,
        reloadProfessionRequests: userProfessionRequests.reloadProfessionRequests,
        reloadAll: async () => {
            await Promise.allSettled([
                loadJobTypesWithSubtypes(),
                userProfessionRequests.reloadProfessionRequests()
            ]);
        },
        approvedProfessions,
        userToSystemRequest: {
            list: userProfessionRequests.professionsRequestedToSystem,
            makeRequest: userProfessionRequests.requestProfessionToSystem,
            reload: userProfessionRequests.reloadProfessionRequests
        },
        userToUserRequest: {
            list: userProfessionRequests.professionsRequestedBySystem,
            makeRequest: userProfessionRequests.requestProfessionToUser,
            reload: userProfessionRequests.reloadProfessionRequests
        }
    };
}