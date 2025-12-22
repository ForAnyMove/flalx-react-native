import { useEffect, useState } from "react";
import { getSystemTypesWithSubtypes } from "../src/api/jobTypes";
import { fetchUserTypeCreationRequests, sendUserTypeCreationRequest } from "../src/api/jobTypesRegistration";
import { fetchUserProfessions, fetchUserTypeRequests, sendUserTypeRequest } from "../src/api/jobTypesRequests";

function professionRequests({ session }) {
    const [professionsRequestedToSystem, setProfessionsRequestedToSystem] = useState([]);
    const [professionsRequestedBySystem, setProfessionsRequestedBySystem] = useState([]);

    async function loadProfessionRequests() {
        try {
            const [registrationRequestsData, professionRequestsData, userProfessionsData] = await Promise.all([
                fetchUserTypeCreationRequests(session),
                fetchUserTypeRequests(session),
                fetchUserProfessions(session)
            ]);

            const userRequested = [];
            if (professionRequestsData) {
                for (const req of professionRequestsData) {
                    if (req.status === 'approved') continue;
                    userRequested.push(req);
                }
            }

            if (userProfessionsData) {
                for (const profession of userProfessionsData) {
                    userRequested.push({ ...profession, status: 'approved' });
                }
            }

            setProfessionsRequestedToSystem(registrationRequestsData || []);
            setProfessionsRequestedBySystem(userRequested);
        }
        catch (err) {
            console.error('Error loading profession requests:', err);
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

            return data;
        }
        catch (err) {
            console.error('Error sending profession request:', err);
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

            return data;
        }
        catch (err) {
            console.error('Error sending profession request to user:', err);
            throw err;
        }
    }

    useEffect(() => {
        if (session?.token?.access_token) {
            loadProfessionRequests();
        }
    }, [session?.token?.access_token]);

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

    const token = session?.token?.access_token;

    async function loadJobTypesWithSubtypes() {
        setLoadingJobTypes(true);
        setError(null);

        try {
            const data = await getSystemTypesWithSubtypes(session);
            console.log(data);
            
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
            console.error('Error in checkIfVerificationNeeded:', err);
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
        userToSystemRequest: {
            list: userProfessionRequests.professionsRequestedToSystem,
            makeRequest: userProfessionRequests.requestProfessionToSystem
        },
        userToUserRequest: {
            list: userProfessionRequests.professionsRequestedBySystem,
            makeRequest: userProfessionRequests.requestProfessionToUser
        }
    };
}