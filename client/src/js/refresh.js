import createRefresh from 'react-auth-kit/createRefresh';

// Note:
// As part of React-auth-kit to support refresh tokens, we need to define createRefresh, however we will use our own token refresh by interval defined elsewhere.
// As the refreshApiCallback is not well documented on the criteria to trigger callback, the trigger of refreshApiCallback is also intermittent, hence, this will not be used.

const refresh = createRefresh({
    interval: 1, // The time in minutes to refresh the Access token,
    refreshApiCallback: async (param) => {
        if (param.authUserState) {  // Only execute refresh API  when user is still logged in
            return {
                isSuccess: true // Bypass refresh API callback logic by marking it as True, we have our refresh token API logic defined elsewhere.
            }
        }
    }
})

export default refresh;