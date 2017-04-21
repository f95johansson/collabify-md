package main

import (
	"crypto/rand"
	"errors"
	"io/ioutil"
	"log"
	"net/http"

	"golang.org/x/net/context"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/drive/v3"

	"github.com/coreos/go-oidc"
	"fmt"
)

var (
	provider *oidc.Provider
	config   *oauth2.Config
	verfier  *oidc.IDTokenVerifier
	state    = makeRandomState()
)

func makeRandomState() string {
	b := make([]byte, 32)
	rand.Read(b)
	return string(b)
}

func LoginRedirect(ctx context.Context) string { //(*drive.Service, error) {
	provider = getOpenIDConnectProvider(ctx)
	config = getConfig()

	return config.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

func Authenticate(r *http.Request) (string, *oidc.IDToken, error) {
	idTokenString, idToken, err := authenticateCookie(r)
	if err != nil {
		return AuthenticateCallback(r)
	}
	return idTokenString, idToken, err
}

func AuthenticateCallback(r *http.Request) (string, *oidc.IDToken, error) {
	provider = getOpenIDConnectProvider(ctx)
	config = getConfig()

	oauth2Token, err := config.Exchange(ctx, r.URL.Query().Get("code"))
	fmt.Print(oauth2Token.Expiry)
	if err != nil {
		return "", &oidc.IDToken{}, errors.New("Error requesting the OAuth2 token (" + err.Error() + ")")
	}
	rawIDToken, ok := oauth2Token.Extra("id_token").(string)
	if !ok {
		return "", &oidc.IDToken{}, errors.New("Error requesting the id_token")
	}

	return authenticateIDToken(rawIDToken)
}

func authenticateCookie(r *http.Request) (string, *oidc.IDToken, error) {
	provider = getOpenIDConnectProvider(ctx)
	config = getConfig()

	token, err := r.Cookie("token")
	if err != nil {
		return "", &oidc.IDToken{}, errors.New("Error requesting the id_token cookie")
	}

	return authenticateIDToken(token.Value)
}

func authenticateIDToken(token string) (string, *oidc.IDToken, error) {
	oidcConfig := &oidc.Config{
		ClientID:       config.ClientID,
		SkipNonceCheck: true,
	}
	verifier := provider.Verifier(oidcConfig)
	idToken, err := verifier.Verify(ctx, token)
	if err != nil {
		return "", &oidc.IDToken{}, errors.New("Could not validate id_token (" + err.Error() + ")")
	}
	fmt.Println(idToken.Expiry)
	return token, idToken, nil
}

func getOpenIDConnectProvider(ctx context.Context) *oidc.Provider {
	if provider == nil {
		var err error
		provider, err = oidc.NewProvider(ctx, "https://accounts.google.com")
		if err != nil {
			// FIXME: handle error
		}
	}

	return provider
}

func getConfig() *oauth2.Config {
	if config == nil {
		b, err := ioutil.ReadFile("drive-credentials.json")
		if err != nil {
			log.Fatalf("Unable to read drive credentials: %v", err)
		}
		config, err = google.ConfigFromJSON(b, drive.DriveMetadataReadonlyScope) //, drive.DriveFileScope)
		config.Scopes = []string{oidc.ScopeOpenID, drive.DriveMetadataReadonlyScope}
		config.Endpoint = provider.Endpoint()
		config.RedirectURL = "http://localhost:8082/api/login/callback/"
	}
	return config
}

func getUserCredentialsss() { //(*oauth2.Token, error) {
}

func getSavedLoginCredentials() {

}

func getGoogleLoginUrl() {

}

func saveLoginCredentials() {

}

// Google's example code, using it as reference
/*
// getClient uses a Context and Config to retrieve a Token
// then generate a Client. It returns the generated Client.
func getClient(ctx context.Context, config *oauth2.Config) *http.Client {
	cacheFile, err := tokenCacheFile()
	if err != nil {
		log.Fatalf("Unable to get path to cached credential file. %v", err)
	}
	tok, err := tokenFromFile(cacheFile)
	if err != nil {
		tok = getTokenFromWeb(config)
		saveToken(cacheFile, tok)
	}
	return config.Client(ctx, tok)
}

// getTokenFromWeb uses Config to request a Token.
// It returns the retrieved Token.
func getTokenFromWeb(config *oauth2.Config) *oauth2.Token {
	authURL := config.AuthCodeURL("state-token") //, oauth2.AccessTypeOffline)
	fmt.Printf("Go to the following link in your browser then type the "+
		"authorization code: \n%v\n", authURL)

	var code string
	if _, err := fmt.Scan(&code); err != nil {
		log.Fatalf("Unable to read authorization code %v", err)
	}

	tok, err := config.Exchange(oauth2.NoContext, code)
	if err != nil {
		log.Fatalf("Unable to retrieve token from web %v", err)
	}
	return tok
}

// tokenCacheFile generates credential file path/filename.
// It returns the generated credential path/filename.
func tokenCacheFile() (string, error) {
	usr, err := user.Current()
	if err != nil {
		return "", err
	}
	tokenCacheDir := filepath.Join(usr.HomeDir, ".credentials")
	os.MkdirAll(tokenCacheDir, 0700)
	return filepath.Join(tokenCacheDir,
		url.QueryEscape("drive-go-quickstart.json")), err
}

// tokenFromFile retrieves a Token from a given file path.
// It returns the retrieved Token and any read error encountered.
func tokenFromFile(file string) (*oauth2.Token, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	t := &oauth2.Token{}
	err = json.NewDecoder(f).Decode(t)
	defer f.Close()
	return t, err
}

// saveToken uses a file path to create a file and store the
// token in it.
func saveToken(file string, token *oauth2.Token) {
	fmt.Printf("Saving credential file to: %s\n", file)
	f, err := os.OpenFile(file, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		log.Fatalf("Unable to cache oauth token: %v", err)
	}
	defer f.Close()
	json.NewEncoder(f).Encode(token)
}

func mainnnnnn() {
	ctx := context.Background()

	b, err := ioutil.ReadFile("drive-credentials.json")
	if err != nil {
		log.Fatalf("Unable to read client secret file: %v", err)
	}

	// If modifying these scopes, delete your previously saved credentials
	// at ~/.credentials/drive-go-quickstart.json
	config, err := google.ConfigFromJSON(b, drive.DriveMetadataReadonlyScope) //, drive.DriveFileScope)
	if err != nil {
		log.Fatalf("Unable to parse client secret file to config: %v", err)
	}
	client := getClient(ctx, config)

	srv, err := drive.New(client)
	if err != nil {
		log.Fatalf("Unable to retrieve drive Client %v", err)
	}

	r, err := srv.Files.List().PageSize(10).
		Fields("nextPageToken, files(id, name)").Do()
	if err != nil {
		log.Fatalf("Unable to retrieve files: %v", err)
	}

	fmt.Println("Files:")
	if len(r.Files) > 0 {
		for _, i := range r.Files {
			fmt.Printf("%s (%s)\n", i.Name, i.Id)
		}
	} else {
		fmt.Println("No files found.")
	}

}
*/
