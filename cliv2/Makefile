# Build system related variables
GOCMD = go
GOOS = darwin
GOARCH = amd64
HASH = sha
HASH_ALGORITHM = 256
CLI_V2_VERSION_TAG = 2.0.0-prerelease
CLI_V1_VERSION_TAG = 
CLI_V1_LOCATION = 

# Make directories per convention
prefix = /usr/local
exec_prefix = $(prefix)
bindir = $(exec_prefix)/bin

# Project related variables
WORKING_DIR = $(CURDIR)
BUILD_DIR = $(WORKING_DIR)/_bin
CACHE_DIR = $(WORKING_DIR)/_cache

# load cached variables if available
-include $(CACHE_DIR)/variables.mk
-include $(CACHE_DIR)/version.mk

# the platform string used by the deployed binaries is not excatly OS-ARCH so we need to translate a bit
_V1_OS = $(GOOS)
_V1_ARCH = $(GOARCH)
_EMPTY =
_EXE_POSTFIX = 
_SEPARATOR = _

ifeq ($(_V1_OS), darwin)
	_V1_OS = macos
else ifeq ($(_V1_OS), windows)
	_V1_OS = win
	_EXE_POSTFIX = .exe
endif

ifeq ($(_V1_ARCH), amd64)
	_V1_ARCH = 
endif

ifeq ($(_V1_ARCH), $(_EMPTY))
	V1_PLATFORM_STING = $(_V1_OS)
else 
	V1_PLATFORM_STING = $(_V1_OS)-$(_V1_ARCH)
endif

# find out whether to download CLIv1 executable
_V1_DOWNLOAD = true
ifneq ($(CLI_V1_LOCATION), $(_EMPTY)) 
	ifeq ($(CLI_V1_VERSION_TAG), $(_EMPTY))
		CLI_V1_VERSION_TAG = $(shell cat "$(CLI_V1_LOCATION)/version")
	endif
	_V1_DOWNLOAD = false
endif


# some globally assembled variables
APPLICATION_NAME = snyk
TEST_NAME = $(APPLICATION_NAME)$(_SEPARATOR)tests
V2_PLATFORM_STRING = $(GOOS)$(_SEPARATOR)$(GOARCH)
V2_EXECUTABLE_NAME = $(APPLICATION_NAME)$(_SEPARATOR)$(V2_PLATFORM_STRING)$(_EXE_POSTFIX)
V1_EXECUTABLE_NAME = $(APPLICATION_NAME)-$(V1_PLATFORM_STING)$(_EXE_POSTFIX)
V2_DIRECTORY = $(WORKING_DIR)/internal/cliv2
V1_DIRECTORY = $(WORKING_DIR)/internal/embedded/cliv1
V1_DOWNLOAD_LINK = https://static.snyk.io/cli/$(CLI_V1_VERSION_TAG)/$(V1_EXECUTABLE_NAME)
V1_EMBEDDED_FILE_TEMPLATE = $(V1_DIRECTORY)/embedded_binary_template.txt
V1_EMBEDDED_FILE_OUTPUT = embedded$(_SEPARATOR)$(V2_PLATFORM_STRING).go
HASH_STRING = $(HASH)$(HASH_ALGORITHM)
TEST_SNYK_EXECUTABLE_PATH=$(BUILD_DIR)/$(V2_EXECUTABLE_NAME)
TEST_EXECUTABLE_NAME = $(TEST_NAME)$(_SEPARATOR)$(V2_PLATFORM_STRING)$(_EXE_POSTFIX)

# some make file variables
LOG_PREFIX = --

# determine the latest cli version if no version was explicitly defined
$(CACHE_DIR)/version.mk: $(CACHE_DIR)
ifeq ($(CLI_V1_VERSION_TAG), $(_EMPTY))
	CLI_V1_VERSION_TAG = $(shell curl --fail --progress-bar -L https://static.snyk.io/cli/latest/version)
endif
	@echo "CLI_V1_VERSION_TAG=$(CLI_V1_VERSION_TAG)\nCLI_V2_VERSION_TAG=$(CLI_V2_VERSION_TAG)" > $(CACHE_DIR)/version.mk
	@echo "$(LOG_PREFIX) Using cliv1 version ( $(CLI_V1_VERSION_TAG) )"
	@echo "$(LOG_PREFIX) Building cliv2 version ( $(CLI_V2_VERSION_TAG) )"

$(BUILD_DIR):
	@mkdir $@

$(CACHE_DIR):
	@mkdir $@

$(CACHE_DIR)/variables.mk: $(CACHE_DIR)
	@echo "GOOS=$(GOOS)\nGOARCH=$(GOARCH)\n" > $(CACHE_DIR)/variables.mk

$(V1_DIRECTORY)/$(V1_EMBEDDED_FILE_OUTPUT):
	@echo "$(LOG_PREFIX) Generating ( $(V1_DIRECTORY)/$(V1_EMBEDDED_FILE_OUTPUT) )"
	@sed -e 's/FILENAME/$(V1_EXECUTABLE_NAME)/g' $(V1_EMBEDDED_FILE_TEMPLATE) > $(V1_DIRECTORY)/$(V1_EMBEDDED_FILE_OUTPUT)

$(V1_DIRECTORY)/cliv1.version:
	@echo "$(CLI_V1_VERSION_TAG)" > $(V1_DIRECTORY)/cliv1.version

$(V2_DIRECTORY)/cliv2.version:
	@echo "$(CLI_V2_VERSION_TAG)" > $(V2_DIRECTORY)/cliv2.version

$(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME): $(V1_DIRECTORY)/cliv1.version
ifeq ($(_V1_DOWNLOAD), true)
	@echo "$(LOG_PREFIX) Downloading cliv1 executable ( $(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME) )"
	@curl --fail --progress-bar -Lo $(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME) $(V1_DOWNLOAD_LINK)
else
	@echo "$(LOG_PREFIX) Copying cliv1 executable ( $(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME) )"
	@cp $(CLI_V1_LOCATION)/$(V1_EXECUTABLE_NAME) $(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME)
endif

$(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME).$(HASH_STRING): $(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME)
ifeq ($(_V1_DOWNLOAD), true)
	@echo "$(LOG_PREFIX) Downloading cliv1 checksum ( $(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME).$(HASH_STRING) )"
	@curl --fail --progress-bar -Lo $(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME).$(HASH_STRING) $(V1_DOWNLOAD_LINK).$(HASH_STRING)
else
	@echo "$(LOG_PREFIX) Copying cliv1 checksum ( $(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME).$(HASH_STRING) )"
	@cp $(CLI_V1_LOCATION)/$(V1_EXECUTABLE_NAME).$(HASH_STRING) $(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME).$(HASH_STRING)
endif

.PHONY: _validate_sha
_validate_sha: $(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME).$(HASH_STRING)
	@echo "$(LOG_PREFIX) Validating checksum ( $(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME).$(HASH_STRING) )"
	@cd $(V1_DIRECTORY) && shasum -b -q -a $(HASH_ALGORITHM) -c $(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME).$(HASH_STRING)

# separate dependency target
.PHONY: dependencies
dependencies: $(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME) $(V1_DIRECTORY)/$(V1_EXECUTABLE_NAME).$(HASH_STRING) _validate_sha

# prepare the workspace and cache global parameters
.PHONY: configure
configure: $(V2_DIRECTORY)/cliv2.version $(CACHE_DIR) $(CACHE_DIR)/version.mk $(CACHE_DIR)/variables.mk $(V1_DIRECTORY)/$(V1_EMBEDDED_FILE_OUTPUT) dependencies

$(BUILD_DIR)/$(V2_EXECUTABLE_NAME): $(BUILD_DIR) 
	@echo "$(LOG_PREFIX) Building ( $(BUILD_DIR)/$(V2_EXECUTABLE_NAME) )"
	@GOOS=$(GOOS) GOARCH=$(GOARCH) $(GOCMD) build -o $(BUILD_DIR)/$(V2_EXECUTABLE_NAME) $(WORKING_DIR)/cmd/cliv2/main.go

$(BUILD_DIR)/$(V2_EXECUTABLE_NAME).$(HASH_STRING): $(BUILD_DIR)/$(V2_EXECUTABLE_NAME)
	@echo "$(LOG_PREFIX) Generating checksum ( $(BUILD_DIR)/$(V2_EXECUTABLE_NAME).$(HASH_STRING) )"
	@cd $(BUILD_DIR) && shasum -a $(HASH_ALGORITHM) --binary $(V2_EXECUTABLE_NAME) > $(V2_EXECUTABLE_NAME).$(HASH_STRING)

$(BUILD_DIR)/$(TEST_EXECUTABLE_NAME):
	@echo "$(LOG_PREFIX) Building test executable ( $(BUILD_DIR)/$(TEST_EXECUTABLE_NAME) )"
	@GOOS=$(GOOS) GOARCH=$(GOARCH) $(GOCMD) test -c -o $(BUILD_DIR)/$(TEST_EXECUTABLE_NAME) main_integration_test.go

.PHONY: build
build: configure $(BUILD_DIR)/$(V2_EXECUTABLE_NAME) $(BUILD_DIR)/$(V2_EXECUTABLE_NAME).$(HASH_STRING)

.PHONY: build-test
build-test: build $(BUILD_DIR)/$(TEST_EXECUTABLE_NAME)

.PHONY: test
test: build-test
	TEST_SNYK_EXECUTABLE_PATH=$(TEST_SNYK_EXECUTABLE_PATH) $(BUILD_DIR)/$(TEST_EXECUTABLE_NAME) -test.v

.PHONY: clean
clean:
	@rm -f -r $(BUILD_DIR)
	@rm -f -r $(CACHE_DIR)
	@rm -f $(V1_DIRECTORY)/$(APPLICATION_NAME)-*
	@rm -f $(V1_DIRECTORY)/$(V1_EMBEDDED_FILE_OUTPUT)
	@rm -f $(V1_DIRECTORY)/cliv1.version
	@rm -f $(V2_DIRECTORY)/cliv2.version

.PHONY: install
install:
	@echo "$(LOG_PREFIX) Installing $(V2_EXECUTABLE_NAME) ( $(DESTDIR)$(bindir) )"
	@mkdir -p $(DESTDIR)$(bindir)
	@cp $(BUILD_DIR)/$(V2_EXECUTABLE_NAME) $(DESTDIR)$(bindir)
	@cp $(BUILD_DIR)/$(V2_EXECUTABLE_NAME).$(HASH_STRING) $(DESTDIR)$(bindir)
	@cp $(BUILD_DIR)/$(TEST_EXECUTABLE_NAME) $(DESTDIR)$(bindir)

.PHONY: help
help:
	@echo "Main targets:"
	@echo "$(LOG_PREFIX) build"
	@echo "$(LOG_PREFIX) build-test"
	@echo "$(LOG_PREFIX) test"
	@echo "$(LOG_PREFIX) install"
	@echo "$(LOG_PREFIX) clean"
	@echo "\nAvailable parameter:"
	@echo "$(LOG_PREFIX) GOOS                       Specify Operating System to compile for (see golang GOOS, default=$(GOOS))"
	@echo "$(LOG_PREFIX) GOARCH                     Specify Architecture to compile for (see golang GOARCH, default=$(GOARCH))"
	@echo "$(LOG_PREFIX) CLI_V2_VERSION_TAG         Version of the CLIv2 without the CLIv1 version (default=$(CLI_V2_VERSION_TAG))"
	@echo "$(LOG_PREFIX) CLI_V1_VERSION_TAG         Version of the CLIv1 to bundle"
	@echo "$(LOG_PREFIX) CLI_V1_LOCATION            Filesystem location of CLIv1 binaries to bundle, if specified, CLI_V1_VERSION_TAG is also required"
	@echo "$(LOG_PREFIX) TEST_SNYK_EXECUTABLE_PATH  Filesystem location of binary under test (default=$(TEST_SNYK_EXECUTABLE_PATH))"
	@echo "$(LOG_PREFIX) prefix                     Installation prefix (default=$(prefix))"	
	@echo "$(LOG_PREFIX) DESTDIR                    For staged installations"
