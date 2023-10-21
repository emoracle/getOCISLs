import { promises as fs } from 'fs';

/**
 * Writes the provided security list to a file, formatted as JSON.
 * @param {object} sl - The security list to write.
 * @param {string} vcnName - The name of the VCN.
 */
async function writeSecurityListToFile(sl, vcnName) {
    let fileName = `${vcnName}_${sl.displayName}`.replace(/[/.]/g, '_');
    fileName = `./output/${fileName}.json`;
    try {
        await fs.mkdir('./output', { recursive: true });
        await fs.writeFile(fileName, JSON.stringify(sl, null, 2)); // 2 spaces for formatting
    } catch (error) {
        console.error(`Error writing to file ${fileName}:`, error.message);
    }
}

/**
 * Deletes all files within the provided directory path.
 * @param {string} directoryPath - The path to the directory.
 */
async function deleteFilesInDirectory(directoryPath) {
    try {
        const files = await fs.readdir(directoryPath);
        const deletePromises = files.map(file => fs.unlink(`${directoryPath}/${file}`));
        await Promise.all(deletePromises);
    } catch (error) {
        console.error(`Error deleting files in ${directoryPath}:`, error);
    }
}

export { writeSecurityListToFile, deleteFilesInDirectory };
